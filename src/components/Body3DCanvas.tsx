import React, { useEffect, useRef, useState, useMemo } from "react";
import * as THREE from "three";
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Play,
  Pause,
  User,
  Layers,
  Sparkles,
  Maximize2,
  Compass,
} from "lucide-react";

export interface Body3DMetrics {
  heightCm: number;
  weightKg: number;
  bodyFatPercent: number;
  gender: "male" | "female";
  chestCm?: number;
  waistCm?: number;
  armCm?: number;
  thighCm?: number;
  calvesCm?: number;
}

interface Body3DCanvasProps {
  metrics: Body3DMetrics;
  selectedRegionId?: string | null;
  onSelectRegion?: (regionId: string) => void;
  className?: string;
  stealthMode?: boolean;
}

export const Body3DCanvas: React.FC<Body3DCanvasProps> = ({
  metrics,
  selectedRegionId,
  onSelectRegion,
  className = "",
  stealthMode = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const humanGroupRef = useRef<THREE.Group | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Interaction controls state
  const [activeGender, setActiveGender] = useState<"male" | "female">(
    metrics.gender || "male"
  );
  const [renderStyle, setRenderStyle] = useState<"solid" | "wireframe" | "hud">("solid");
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [viewPreset, setViewPreset] = useState<"front" | "side_r" | "side_l" | "back" | "free">("front");

  // Keep internal gender in sync if props change
  useEffect(() => {
    if (metrics.gender) {
      setActiveGender(metrics.gender);
    }
  }, [metrics.gender]);

  // Mouse drag orbital rotation state
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const rotationAnglesRef = useRef({ yaw: 0, pitch: 0 });
  const zoomLevelRef = useRef(3.3);

  // Calculate anatomical scaling factors from user's biometrics
  const factors = useMemo(() => {
    const isMale = activeGender === "male";
    const heightRatio = Math.max(0.85, Math.min(1.25, (metrics.heightCm || 175) / 175));
    const bmi = (metrics.weightKg || 75) / Math.pow((metrics.heightCm || 175) / 100, 2);
    const fatRatio = Math.max(0.7, Math.min(1.5, (metrics.bodyFatPercent || 15) / 15));

    // Anthropometric circumference calibrations
    const chestScale = metrics.chestCm
      ? metrics.chestCm / (isMale ? 100 : 92)
      : Math.max(0.85, Math.min(1.3, 1 + (bmi - 23) * 0.025));

    const waistScale = metrics.waistCm
      ? metrics.waistCm / (isMale ? 82 : 72)
      : Math.max(0.8, Math.min(1.4, 1 + (bmi - 23) * 0.035 * fatRatio));

    const armScale = metrics.armCm
      ? metrics.armCm / (isMale ? 35 : 28)
      : Math.max(0.85, Math.min(1.35, 1 + (bmi - 23) * 0.02));

    const thighScale = metrics.thighCm
      ? metrics.thighCm / (isMale ? 56 : 54)
      : Math.max(0.85, Math.min(1.35, 1 + (bmi - 23) * 0.022));

    const calvesScale = metrics.calvesCm
      ? metrics.calvesCm / (isMale ? 38 : 36)
      : Math.max(0.85, Math.min(1.3, 1 + (bmi - 23) * 0.015));

    return {
      isMale,
      heightRatio,
      chestScale: Math.max(0.75, Math.min(1.45, chestScale)),
      waistScale: Math.max(0.75, Math.min(1.55, waistScale)),
      armScale: Math.max(0.75, Math.min(1.45, armScale)),
      thighScale: Math.max(0.75, Math.min(1.45, thighScale)),
      calvesScale: Math.max(0.75, Math.min(1.4, calvesScale)),
    };
  }, [activeGender, metrics]);

  // Main Three.js Scene Setup & Model Construction
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Dimensions
    const width = container.clientWidth || 340;
    const height = container.clientHeight || 420;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x050505);

    // Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 0.1, zoomLevelRef.current);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Empty container then append canvas
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // Monochromatic Studio Lighting
    const ambientLight = new THREE.AmbientLight(0x27272a, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(3, 4, 3);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xa1a1aa, 1.0);
    fillLight.position.set(-3, 2, -2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 2.2);
    rimLight.position.set(0, 3, -4);
    scene.add(rimLight);

    const bottomLight = new THREE.PointLight(0x71717a, 0.8, 8);
    bottomLight.position.set(0, -2, 1);
    scene.add(bottomLight);

    // Circular Radar Floor Grid
    const floorGroup = new THREE.Group();
    const gridHelper = new THREE.GridHelper(3, 14, 0x52525b, 0x27272a);
    gridHelper.position.y = -1.65;
    floorGroup.add(gridHelper);

    const ringGeo = new THREE.RingGeometry(0.8, 0.82, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x3f3f46, side: THREE.DoubleSide });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = -1.64;
    floorGroup.add(ringMesh);
    scene.add(floorGroup);

    // Humanoid Model Hierarchical Rig
    const humanGroup = new THREE.Group();
    humanGroupRef.current = humanGroup;
    scene.add(humanGroup);

    // Base materials according to renderStyle
    const isWire = renderStyle === "wireframe";
    const isHud = renderStyle === "hud";

    const createSegmentMaterial = (regionKey: string, baseHex = 0x27272a, emissiveHex = 0x000000) => {
      const isSelected = selectedRegionId === regionKey;
      if (isSelected) {
        return new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0x52525b,
          roughness: 0.25,
          metalness: 0.45,
          wireframe: isWire,
        });
      }
      return new THREE.MeshStandardMaterial({
        color: isHud ? 0x18181b : baseHex,
        emissive: emissiveHex,
        roughness: 0.4,
        metalness: 0.3,
        wireframe: isWire,
      });
    };

    const isMale = factors.isMale;

    // --- 1. HEAD, JAW & CRANIUM ---
    const headMat = createSegmentMaterial("head", 0x3f3f46);
    
    // Cranium
    const headGeo = new THREE.SphereGeometry(0.18, 28, 28);
    headGeo.scale(0.84, 1.12, 0.94);
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.position.set(0, 1.36, 0);
    humanGroup.add(headMesh);

    // Jaw / Chin contour
    const jawGeo = new THREE.CylinderGeometry(
      0.11 * (isMale ? 1.05 : 0.9),
      0.06 * (isMale ? 1.1 : 0.8),
      0.14,
      16
    );
    jawGeo.scale(0.9, 1, 0.85);
    const jawMesh = new THREE.Mesh(jawGeo, headMat);
    jawMesh.position.set(0, 1.25, 0.04);
    humanGroup.add(jawMesh);

    // Neck with sternocleidomastoid profile
    const neckGeo = new THREE.CylinderGeometry(
      0.075 * (isMale ? 1.15 : 0.9),
      0.095 * (isMale ? 1.2 : 0.92),
      0.15,
      18
    );
    const neckMesh = new THREE.Mesh(neckGeo, headMat);
    neckMesh.position.set(0, 1.16, -0.01);
    humanGroup.add(neckMesh);

    // Trapezius slope (connects neck to shoulders)
    const trapGeo = new THREE.CylinderGeometry(
      0.10 * (isMale ? 1.2 : 0.9),
      (isMale ? 0.32 : 0.26) * factors.chestScale,
      0.12,
      16
    );
    trapGeo.scale(1, 1, 0.65);
    const trapMesh = new THREE.Mesh(trapGeo, headMat);
    trapMesh.position.set(0, 1.08, -0.02);
    humanGroup.add(trapMesh);

    // --- 2. THORAX & CHEST ---
    const chestMat = createSegmentMaterial("chest", 0x27272a);
    const chestWidthTop = (isMale ? 0.38 : 0.30) * factors.chestScale;
    const chestWidthBottom = (isMale ? 0.29 : 0.24) * factors.waistScale;
    const chestDepth = (isMale ? 0.22 : 0.20) * factors.chestScale;

    // Upper Torso Mesh (Ribcage)
    const chestGeo = new THREE.CylinderGeometry(chestWidthTop, chestWidthBottom, 0.36, 24);
    chestGeo.scale(1, 1, chestDepth / (isMale ? 0.38 : 0.30));
    const chestMesh = new THREE.Mesh(chestGeo, chestMat);
    chestMesh.position.y = 0.89;
    humanGroup.add(chestMesh);

    // Anatomical Pectoral / Breast Contours
    if (isMale) {
      // Pectoralis Major slabs
      const pecGeo = new THREE.BoxGeometry(0.14 * factors.chestScale, 0.12, 0.06);
      const leftPec = new THREE.Mesh(pecGeo, chestMat);
      leftPec.position.set(-0.09 * factors.chestScale, 0.93, 0.11 * factors.chestScale);
      leftPec.rotation.set(-0.05, 0, 0.06);
      humanGroup.add(leftPec);

      const rightPec = new THREE.Mesh(pecGeo, chestMat);
      rightPec.position.set(0.09 * factors.chestScale, 0.93, 0.11 * factors.chestScale);
      rightPec.rotation.set(-0.05, 0, -0.06);
      humanGroup.add(rightPec);
    } else {
      // Female Breast contour (curved smooth spheres)
      const breastRadius = 0.095 * factors.chestScale;
      const breastGeo = new THREE.SphereGeometry(breastRadius, 20, 20);
      breastGeo.scale(1.0, 1.15, 1.3);

      const leftBreast = new THREE.Mesh(breastGeo, chestMat);
      leftBreast.position.set(-0.10 * factors.chestScale, 0.89, 0.11 * factors.chestScale);
      leftBreast.rotation.x = -0.1;
      humanGroup.add(leftBreast);

      const rightBreast = new THREE.Mesh(breastGeo, chestMat);
      rightBreast.position.set(0.10 * factors.chestScale, 0.89, 0.11 * factors.chestScale);
      rightBreast.rotation.x = -0.1;
      humanGroup.add(rightBreast);
    }

    // Upper back / Latissimus Dorsi flare
    const latsGeo = new THREE.BoxGeometry(
      (isMale ? 0.34 : 0.28) * factors.chestScale,
      0.26,
      0.08
    );
    const latsMesh = new THREE.Mesh(latsGeo, chestMat);
    latsMesh.position.set(0, 0.88, -0.09 * factors.chestScale);
    humanGroup.add(latsMesh);

    // --- 3. ABDOMEN & CORE WAIST ---
    const abdomenMat = createSegmentMaterial("abdomen", 0x27272a);
    const waistWidthTop = chestWidthBottom;
    const waistWidthBottom = (isMale ? 0.30 : 0.35) * factors.waistScale;
    const waistDepth = (isMale ? 0.19 : 0.18) * factors.waistScale;

    const waistGeo = new THREE.CylinderGeometry(waistWidthTop, waistWidthBottom, 0.30, 24);
    waistGeo.scale(1, 1, waistDepth / (isMale ? 0.30 : 0.25));
    const waistMesh = new THREE.Mesh(waistGeo, abdomenMat);
    waistMesh.position.y = 0.56;
    humanGroup.add(waistMesh);

    // Abdominal rectus detail (subtle sculpt)
    if (isMale) {
      const absGeo = new THREE.BoxGeometry(0.12 * factors.waistScale, 0.24, 0.03);
      const absMesh = new THREE.Mesh(absGeo, abdomenMat);
      absMesh.position.set(0, 0.57, waistDepth * 0.52);
      humanGroup.add(absMesh);
    }

    // --- 4. PELVIS, HIPS & GLUTES ---
    const pelvisMat = createSegmentMaterial("waist", 0x27272a);
    const pelvisWidth = (isMale ? 0.31 : 0.37) * factors.waistScale;
    const pelvisDepth = (isMale ? 0.21 : 0.24);
    const pelvisGeo = new THREE.CylinderGeometry(waistWidthBottom, pelvisWidth * 0.96, 0.24, 24);
    pelvisGeo.scale(1, 1, pelvisDepth);
    const pelvisMesh = new THREE.Mesh(pelvisGeo, pelvisMat);
    pelvisMesh.position.y = 0.30;
    humanGroup.add(pelvisMesh);

    // Gluteus contours on back
    const gluteRadius = (isMale ? 0.105 : 0.13) * factors.thighScale;
    const gluteGeo = new THREE.SphereGeometry(gluteRadius, 18, 18);
    gluteGeo.scale(0.95, 1.1, 1.05);

    const leftGlute = new THREE.Mesh(gluteGeo, pelvisMat);
    leftGlute.position.set(-0.08 * factors.waistScale, 0.28, -0.09 * (isMale ? 1.0 : 1.15));
    humanGroup.add(leftGlute);

    const rightGlute = new THREE.Mesh(gluteGeo, pelvisMat);
    rightGlute.position.set(0.08 * factors.waistScale, 0.28, -0.09 * (isMale ? 1.0 : 1.15));
    humanGroup.add(rightGlute);

    // --- 5. SHOULDERS & ARMS ---
    const armMat = createSegmentMaterial("arms", 0x3f3f46);
    const armRadius = (isMale ? 0.085 : 0.065) * factors.armScale;
    const shoulderWidth = chestWidthTop + 0.06;

    // Left Arm Group
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-shoulderWidth, 1.02, 0);

    // Deltoid (Shoulder Cap)
    const deltoidGeo = new THREE.SphereGeometry(armRadius * 1.3, 18, 18);
    deltoidGeo.scale(1.1, 1.25, 1.05);
    const leftDeltoid = new THREE.Mesh(deltoidGeo, armMat);
    leftArmGroup.add(leftDeltoid);

    // Biceps / Triceps Upper arm
    const upperArmGeo = new THREE.CylinderGeometry(armRadius * 1.12, armRadius * 0.92, 0.36, 18);
    const leftUpperArm = new THREE.Mesh(upperArmGeo, armMat);
    leftUpperArm.position.y = -0.21;
    leftArmGroup.add(leftUpperArm);

    // Elbow Joint
    const elbowGeo = new THREE.SphereGeometry(armRadius * 0.88, 14, 14);
    const leftElbow = new THREE.Mesh(elbowGeo, armMat);
    leftElbow.position.y = -0.40;
    leftArmGroup.add(leftElbow);

    // Forearm with anatomical taper
    const forearmGeo = new THREE.CylinderGeometry(armRadius * 0.96, armRadius * 0.72, 0.34, 18);
    const leftForearm = new THREE.Mesh(forearmGeo, armMat);
    leftForearm.position.y = -0.58;
    leftArmGroup.add(leftForearm);

    // Hand & wrist
    const handGeo = new THREE.BoxGeometry(armRadius * 1.15, 0.12, armRadius * 0.55);
    const leftHand = new THREE.Mesh(handGeo, armMat);
    leftHand.position.y = -0.79;
    leftArmGroup.add(leftHand);

    // Natural resting stance angle
    leftArmGroup.rotation.z = 0.13;
    humanGroup.add(leftArmGroup);

    // Right Arm Group
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(shoulderWidth, 1.02, 0);

    const rightDeltoid = new THREE.Mesh(deltoidGeo, armMat);
    rightArmGroup.add(rightDeltoid);

    const rightUpperArm = new THREE.Mesh(upperArmGeo, armMat);
    rightUpperArm.position.y = -0.21;
    rightArmGroup.add(rightUpperArm);

    const rightElbow = new THREE.Mesh(elbowGeo, armMat);
    rightElbow.position.y = -0.40;
    rightArmGroup.add(rightElbow);

    const rightForearm = new THREE.Mesh(forearmGeo, armMat);
    rightForearm.position.y = -0.58;
    rightArmGroup.add(rightForearm);

    const rightHand = new THREE.Mesh(handGeo, armMat);
    rightHand.position.y = -0.79;
    rightArmGroup.add(rightHand);

    rightArmGroup.rotation.z = -0.13;
    humanGroup.add(rightArmGroup);

    // --- 6. LEGS, THIGHS & CALVES ---
    const thighMat = createSegmentMaterial("thighs", 0x27272a);
    const calvesMat = createSegmentMaterial("calves", 0x3f3f46);

    const legSpacing = (isMale ? 0.135 : 0.155) * factors.waistScale;
    const thighRadiusTop = (isMale ? 0.138 : 0.132) * factors.thighScale;
    const thighRadiusBottom = (isMale ? 0.102 : 0.096) * factors.thighScale;
    const calvesRadius = (isMale ? 0.092 : 0.078) * factors.calvesScale;

    // Helper to create anatomical leg with natural curves
    const createLeg = (isLeft: boolean) => {
      const legGroup = new THREE.Group();
      const xOffset = isLeft ? -legSpacing : legSpacing;
      legGroup.position.set(xOffset, 0.20, 0);

      // Thigh (Quadriceps & Hamstrings)
      const thighGeo = new THREE.CylinderGeometry(thighRadiusTop, thighRadiusBottom, 0.58, 22);
      thighGeo.scale(1.08, 1, 1.18);
      const thighMesh = new THREE.Mesh(thighGeo, thighMat);
      thighMesh.position.y = -0.29;
      legGroup.add(thighMesh);

      // Knee joint patella
      const kneeGeo = new THREE.SphereGeometry(thighRadiusBottom * 1.02, 16, 16);
      const kneeMesh = new THREE.Mesh(kneeGeo, thighMat);
      kneeMesh.position.set(0, -0.59, 0.02);
      legGroup.add(kneeMesh);

      // Calves (Gastrocnemius belly curve)
      const calvesBellyGeo = new THREE.SphereGeometry(calvesRadius * 1.12, 18, 18);
      calvesBellyGeo.scale(0.95, 1.4, 1.25);
      const calvesBellyMesh = new THREE.Mesh(calvesBellyGeo, calvesMat);
      calvesBellyMesh.position.set(0, -0.78, -0.015);
      legGroup.add(calvesBellyMesh);

      // Lower leg shaft / Shin
      const shinGeo = new THREE.CylinderGeometry(calvesRadius * 0.95, calvesRadius * 0.68, 0.54, 20);
      shinGeo.scale(1, 1, 1.12);
      const shinMesh = new THREE.Mesh(shinGeo, calvesMat);
      shinMesh.position.y = -0.91;
      legGroup.add(shinMesh);

      // Ankle joint
      const ankleGeo = new THREE.SphereGeometry(calvesRadius * 0.72, 14, 14);
      const ankleMesh = new THREE.Mesh(ankleGeo, calvesMat);
      ankleMesh.position.y = -1.18;
      legGroup.add(ankleMesh);

      // Foot & Arch
      const footGeo = new THREE.BoxGeometry(calvesRadius * 1.22, 0.08, 0.24);
      const footMesh = new THREE.Mesh(footGeo, calvesMat);
      footMesh.position.set(0, -1.24, 0.06);
      legGroup.add(footMesh);

      return legGroup;
    };

    humanGroup.add(createLeg(true));
    humanGroup.add(createLeg(false));

    // Stature normalization
    humanGroup.scale.set(1, factors.heightRatio, 1);
    humanGroup.position.y = -0.2;

    // Apply view angle preset
    const applyPresetRotation = (preset: string) => {
      if (preset === "front") {
        rotationAnglesRef.current = { yaw: 0, pitch: 0 };
      } else if (preset === "side_r") {
        rotationAnglesRef.current = { yaw: -Math.PI / 2, pitch: 0 };
      } else if (preset === "side_l") {
        rotationAnglesRef.current = { yaw: Math.PI / 2, pitch: 0 };
      } else if (preset === "back") {
        rotationAnglesRef.current = { yaw: Math.PI, pitch: 0 };
      }
    };
    applyPresetRotation(viewPreset);

    // Animation Render Loop
    let clock = new THREE.Clock();
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (autoRotate && !isDraggingRef.current && viewPreset === "free") {
        rotationAnglesRef.current.yaw += delta * 0.45;
      }

      // Smooth damped rotation interpolation
      if (humanGroupRef.current) {
        humanGroupRef.current.rotation.y = rotationAnglesRef.current.yaw;
        humanGroupRef.current.rotation.x = rotationAnglesRef.current.pitch;
      }

      if (cameraRef.current) {
        cameraRef.current.position.z = zoomLevelRef.current;
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize Observer for responsive canvas sizing
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      renderer.dispose();
    };
  }, [factors, selectedRegionId, renderStyle, autoRotate, viewPreset]);

  // Pointer Interaction Handlers for 360° Drag Rotation
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;

    rotationAnglesRef.current.yaw += deltaX * 0.012;
    rotationAnglesRef.current.pitch = Math.max(
      -0.5,
      Math.min(0.5, rotationAnglesRef.current.pitch + deltaY * 0.008)
    );

    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    if (viewPreset !== "free") {
      setViewPreset("free");
    }
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  // Zoom controls
  const handleZoom = (delta: number) => {
    zoomLevelRef.current = Math.max(2.0, Math.min(4.5, zoomLevelRef.current + delta));
  };

  const handlePresetClick = (preset: "front" | "side_r" | "side_l" | "back") => {
    setViewPreset(preset);
    if (preset === "front") {
      rotationAnglesRef.current = { yaw: 0, pitch: 0 };
    } else if (preset === "side_r") {
      rotationAnglesRef.current = { yaw: -Math.PI / 2, pitch: 0 };
    } else if (preset === "side_l") {
      rotationAnglesRef.current = { yaw: Math.PI / 2, pitch: 0 };
    } else if (preset === "back") {
      rotationAnglesRef.current = { yaw: Math.PI, pitch: 0 };
    }
  };

  return (
    <div className={`relative w-full bg-[#050505] border border-zinc-800 flex flex-col overflow-hidden select-none ${className}`}>
      {/* Top HUD Controls */}
      <div className="w-full flex items-center justify-between p-2.5 border-b border-zinc-900 bg-black/90 z-10 text-[11px] font-mono">
        {/* Gender Morph Toggle */}
        <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 p-0.5">
          <button
            type="button"
            onClick={() => setActiveGender("male")}
            className={`px-2.5 py-1 transition-all ${
              activeGender === "male"
                ? "bg-white text-black font-bold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            MASCULINO
          </button>
          <button
            type="button"
            onClick={() => setActiveGender("female")}
            className={`px-2.5 py-1 transition-all ${
              activeGender === "female"
                ? "bg-white text-black font-bold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            FEMININO
          </button>
        </div>

        {/* View Angle Presets */}
        <div className="hidden sm:flex items-center gap-1 text-[10px]">
          <button
            type="button"
            onClick={() => handlePresetClick("front")}
            className={`px-2 py-1 border transition-colors ${
              viewPreset === "front"
                ? "border-white bg-zinc-900 text-white font-bold"
                : "border-zinc-800 text-zinc-400 hover:border-zinc-600"
            }`}
          >
            FRENTE
          </button>
          <button
            type="button"
            onClick={() => handlePresetClick("side_r")}
            className={`px-2 py-1 border transition-colors ${
              viewPreset === "side_r"
                ? "border-white bg-zinc-900 text-white font-bold"
                : "border-zinc-800 text-zinc-400 hover:border-zinc-600"
            }`}
          >
            LATERAL
          </button>
          <button
            type="button"
            onClick={() => handlePresetClick("back")}
            className={`px-2 py-1 border transition-colors ${
              viewPreset === "back"
                ? "border-white bg-zinc-900 text-white font-bold"
                : "border-zinc-800 text-zinc-400 hover:border-zinc-600"
            }`}
          >
            COSTAS
          </button>
        </div>

        {/* Auto Rotation & Shading Style */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setRenderStyle((prev) =>
                prev === "solid" ? "wireframe" : prev === "wireframe" ? "hud" : "solid"
              );
            }}
            className="flex items-center gap-1 px-2 py-1 border border-zinc-800 hover:border-zinc-600 text-zinc-300 text-[10px]"
            title="Alternar estilo de renderização 3D"
          >
            <Layers className="w-3 h-3 text-zinc-400" />
            <span className="uppercase">{renderStyle}</span>
          </button>

          <button
            type="button"
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-1 border text-xs transition-colors ${
              autoRotate
                ? "border-white bg-zinc-900 text-white"
                : "border-zinc-800 text-zinc-500 hover:border-zinc-700"
            }`}
            title={autoRotate ? "Pausar rotação automática" : "Ativar rotação automática"}
          >
            {autoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas Viewport */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="w-full h-[410px] sm:h-[460px] cursor-grab active:cursor-grabbing relative touch-none flex items-center justify-center"
      >
        {/* Radar Overlay Watermark */}
        <div className="absolute top-3 left-3 pointer-events-none flex flex-col gap-0.5 text-[9px] font-mono text-zinc-600">
          <span>MODELO 3D REALISTA // BIOMETRIA DINÂMICA</span>
          <span className="text-zinc-500">
            ESCALA: {factors.isMale ? "MASC" : "FEM"} • {stealthMode ? "••••" : `${metrics.heightCm}cm`} • {stealthMode ? "••••" : `${metrics.weightKg}kg`}
          </span>
        </div>

        {/* Floating Zoom & Reset Control Pill */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/80 border border-zinc-800 p-1 z-10">
          <button
            type="button"
            onClick={() => handleZoom(-0.3)}
            className="p-1 text-zinc-400 hover:text-white transition-colors"
            title="Aproximar (Zoom In)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleZoom(0.3)}
            className="p-1 text-zinc-400 hover:text-white transition-colors"
            title="Afastar (Zoom Out)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-3 bg-zinc-800" />
          <button
            type="button"
            onClick={() => {
              rotationAnglesRef.current = { yaw: 0, pitch: 0 };
              zoomLevelRef.current = 3.3;
              setViewPreset("front");
            }}
            className="p-1 text-zinc-400 hover:text-white transition-colors"
            title="Restaurar Visão Padrão"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Floating Muscle Selector Chips */}
        <div className="absolute bottom-3 left-3 hidden sm:flex items-center gap-1 bg-black/85 border border-zinc-800 p-1 z-10 text-[9px] font-mono">
          <span className="text-zinc-500 px-1">REGIÃO:</span>
          {[
            { id: "chest", label: "PEITORAL" },
            { id: "abdomen", label: "CINTURA" },
            { id: "arms", label: "BRAÇOS" },
            { id: "thighs", label: "COXAS" },
            { id: "calves", label: "PANTURRILHA" },
          ].map((reg) => (
            <button
              key={reg.id}
              type="button"
              onClick={() => onSelectRegion?.(reg.id)}
              className={`px-1.5 py-0.5 transition-colors ${
                selectedRegionId === reg.id
                  ? "bg-white text-black font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {reg.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
