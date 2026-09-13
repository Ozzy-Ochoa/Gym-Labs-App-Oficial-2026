import React, { useState, useMemo } from "react";
import { BodyMetrics, BodyRegion, UserProfile } from "../types";
import { Body3DCanvas } from "./Body3DCanvas";
import {
  RotateCw,
  TrendingDown,
  TrendingUp,
  Minus,
  Calendar,
  Crosshair,
  Sliders,
  Check,
  RotateCcw,
  User,
  Info,
  ChevronDown,
  ChevronUp,
  Box,
} from "lucide-react";

interface BodyModelViewerProps {
  bodyMetrics: BodyMetrics;
  userProfile?: UserProfile | null;
  onUpdateBodyMetrics?: (updatedMetrics: BodyMetrics) => void;
  onUpdateRegion?: (regionId: string, valueCm: number) => void;
  stealthMode?: boolean;
}

type ViewAngle = "front" | "side" | "back";

export const BodyModelViewer: React.FC<BodyModelViewerProps> = ({
  bodyMetrics,
  userProfile,
  onUpdateBodyMetrics,
  stealthMode = false,
}) => {
  const [selectedRegionId, setSelectedRegionId] = useState<string>("abdomen");
  const [modelEngine, setModelEngine] = useState<"3d" | "2d">("3d");
  const [viewAngle, setViewAngle] = useState<ViewAngle>("front");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("ATUAL");
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);

  // Fallback biometrics
  const weight = bodyMetrics.weightKg || userProfile?.weightKg || 75;
  const height = bodyMetrics.heightCm || userProfile?.heightCm || 175;
  const age = bodyMetrics.age || userProfile?.age || 26;
  const gender = bodyMetrics.gender || userProfile?.gender || "male";

  // Biometric estimation engine (when measurements are missing/unmeasured)
  const estimations = useMemo(() => {
    const bmi = weight / Math.pow(height / 100, 2);
    const bmiRounded = Math.round(bmi * 10) / 10;

    // Body fat via Deurenberg / Gallagher clinical formula
    let calculatedFat =
      gender === "male"
        ? Math.round(((1.2 * bmi) + (0.23 * age) - 16.2) * 10) / 10
        : Math.round(((1.2 * bmi) + (0.23 * age) - 5.4) * 10) / 10;
    calculatedFat = Math.max(6, Math.min(50, calculatedFat));

    const finalFat = bodyMetrics.bodyFatPercent > 0 ? bodyMetrics.bodyFatPercent : calculatedFat;
    const isFatEstimated = bodyMetrics.bodyFatPercent <= 0;

    const leanMass = Math.round(weight * (1 - finalFat / 100) * 10) / 10;
    const muscleMass = Math.round(leanMass * 0.73 * 10) / 10;
    const visceralFat = Math.max(1, Math.min(15, Math.round((bmi - 18) * 0.8 + (age / 20))));

    // Anthropometric circumference regressions (cm)
    const bmiRatio = Math.max(0.7, Math.min(1.5, bmi / 22.5));
    const estimatedCircumferences: Record<string, number> = {
      neck: gender === "male" ? Math.round(38 * Math.sqrt(bmiRatio)) : Math.round(34 * Math.sqrt(bmiRatio)),
      shoulders: Math.round(height * 0.65 * Math.pow(bmiRatio, 0.4)),
      chest: Math.round(height * 0.575 * Math.sqrt(bmiRatio)),
      arm_right: Math.round(height * 0.185 * Math.pow(bmiRatio, 0.45)),
      arm_left: Math.round(height * 0.185 * Math.pow(bmiRatio, 0.45)),
      abdomen: Math.round(height * 0.47 * Math.pow(bmiRatio, 0.75) + (finalFat * 0.35)),
      waist: Math.round(height * 0.435 * Math.pow(bmiRatio, 0.7)),
      thigh_right: Math.round(height * 0.32 * Math.pow(bmiRatio, 0.55)),
      thigh_left: Math.round(height * 0.32 * Math.pow(bmiRatio, 0.55)),
      calves: Math.round(height * 0.21 * Math.pow(bmiRatio, 0.35)),
    };

    return {
      bmi: bmiRounded,
      fatPercent: finalFat,
      isFatEstimated,
      leanMass,
      muscleMass,
      visceralFat,
      estimatedCircumferences,
    };
  }, [weight, height, age, gender, bodyMetrics.bodyFatPercent]);

  // Form input states for real measurements
  const [formWeight, setFormWeight] = useState(weight.toString());
  const [formHeight, setFormHeight] = useState(height.toString());
  const [formFat, setFormFat] = useState(
    bodyMetrics.bodyFatPercent > 0 ? bodyMetrics.bodyFatPercent.toString() : ""
  );
  const [formChest, setFormChest] = useState(
    (bodyMetrics.regions?.chest?.currentCm || estimations.estimatedCircumferences.chest).toString()
  );
  const [formAbdomen, setFormAbdomen] = useState(
    (bodyMetrics.regions?.abdomen?.currentCm || estimations.estimatedCircumferences.abdomen).toString()
  );
  const [formWaist, setFormWaist] = useState(
    (bodyMetrics.regions?.waist?.currentCm || estimations.estimatedCircumferences.waist).toString()
  );
  const [formArmR, setFormArmR] = useState(
    (bodyMetrics.regions?.arm_right?.currentCm || estimations.estimatedCircumferences.arm_right).toString()
  );
  const [formThighR, setFormThighR] = useState(
    (bodyMetrics.regions?.thigh_right?.currentCm || estimations.estimatedCircumferences.thigh_right).toString()
  );
  const [formCalves, setFormCalves] = useState(
    (bodyMetrics.regions?.calves?.currentCm || estimations.estimatedCircumferences.calves).toString()
  );
  const [formNeck, setFormNeck] = useState(
    (bodyMetrics.regions?.neck?.currentCm || estimations.estimatedCircumferences.neck).toString()
  );
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Selected Region Resolution (returns actual measured or estimated fallback)
  const getRegionData = (regionId: string): BodyRegion => {
    const existing = bodyMetrics.regions && bodyMetrics.regions[regionId];
    const estimatedValue = estimations.estimatedCircumferences[regionId] || 75;

    if (existing && existing.currentCm > 0) {
      return existing;
    }

    const friendlyNames: Record<string, string> = {
      neck: "Pescoço",
      shoulders: "Ombros",
      chest: "Peitoral",
      arm_right: "Braço Direito",
      arm_left: "Braço Esquerdo",
      abdomen: "Abdômen",
      waist: "Cintura",
      thigh_right: "Coxa Direita",
      thigh_left: "Coxa Esquerda",
      calves: "Panturrilhas",
    };

    return {
      id: regionId,
      name: friendlyNames[regionId] || regionId,
      currentCm: estimatedValue,
      janCm: Math.round(estimatedValue * 0.98),
      aprCm: Math.round(estimatedValue * 0.99),
      julCm: Math.round(estimatedValue * 1.0),
      sepCm: estimatedValue,
      trend: "stable",
      delta: "0 cm",
      lastMeasured: "Estimativa base",
      isEstimated: true,
    };
  };

  const selectedRegion = getRegionData(selectedRegionId);

  // Save manual measurements to state
  const handleSaveMeasurements = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateBodyMetrics) return;

    const newWeight = Number(formWeight) || weight;
    const newHeight = Number(formHeight) || height;
    const newFat = formFat ? Number(formFat) : estimations.fatPercent;

    const chestVal = Number(formChest) || estimations.estimatedCircumferences.chest;
    const abdVal = Number(formAbdomen) || estimations.estimatedCircumferences.abdomen;
    const waistVal = Number(formWaist) || estimations.estimatedCircumferences.waist;
    const armRVal = Number(formArmR) || estimations.estimatedCircumferences.arm_right;
    const thighRVal = Number(formThighR) || estimations.estimatedCircumferences.thigh_right;
    const calvesVal = Number(formCalves) || estimations.estimatedCircumferences.calves;
    const neckVal = Number(formNeck) || estimations.estimatedCircumferences.neck;

    const todayStr = new Date().toLocaleDateString("pt-BR");

    const updatedRegions: Record<string, BodyRegion> = {
      ...(bodyMetrics.regions || {}),
      neck: {
        id: "neck",
        name: "Pescoço",
        currentCm: neckVal,
        janCm: neckVal,
        aprCm: neckVal,
        julCm: neckVal,
        sepCm: neckVal,
        trend: "stable",
        delta: "0 cm",
        lastMeasured: todayStr,
        isEstimated: false,
      },
      chest: {
        id: "chest",
        name: "Peitoral",
        currentCm: chestVal,
        janCm: chestVal,
        aprCm: chestVal,
        julCm: chestVal,
        sepCm: chestVal,
        trend: "stable",
        delta: "0 cm",
        lastMeasured: todayStr,
        isEstimated: false,
      },
      abdomen: {
        id: "abdomen",
        name: "Abdômen",
        currentCm: abdVal,
        janCm: abdVal,
        aprCm: abdVal,
        julCm: abdVal,
        sepCm: abdVal,
        trend: "stable",
        delta: "0 cm",
        lastMeasured: todayStr,
        isEstimated: false,
      },
      waist: {
        id: "waist",
        name: "Cintura",
        currentCm: waistVal,
        janCm: waistVal,
        aprCm: waistVal,
        julCm: waistVal,
        sepCm: waistVal,
        trend: "stable",
        delta: "0 cm",
        lastMeasured: todayStr,
        isEstimated: false,
      },
      arm_right: {
        id: "arm_right",
        name: "Braço Direito",
        currentCm: armRVal,
        janCm: armRVal,
        aprCm: armRVal,
        julCm: armRVal,
        sepCm: armRVal,
        trend: "stable",
        delta: "0 cm",
        lastMeasured: todayStr,
        isEstimated: false,
      },
      arm_left: {
        id: "arm_left",
        name: "Braço Esquerdo",
        currentCm: armRVal,
        janCm: armRVal,
        aprCm: armRVal,
        julCm: armRVal,
        sepCm: armRVal,
        trend: "stable",
        delta: "0 cm",
        lastMeasured: todayStr,
        isEstimated: false,
      },
      thigh_right: {
        id: "thigh_right",
        name: "Coxa Direita",
        currentCm: thighRVal,
        janCm: thighRVal,
        aprCm: thighRVal,
        julCm: thighRVal,
        sepCm: thighRVal,
        trend: "stable",
        delta: "0 cm",
        lastMeasured: todayStr,
        isEstimated: false,
      },
      thigh_left: {
        id: "thigh_left",
        name: "Coxa Esquerda",
        currentCm: thighRVal,
        janCm: thighRVal,
        aprCm: thighRVal,
        julCm: thighRVal,
        sepCm: thighRVal,
        trend: "stable",
        delta: "0 cm",
        lastMeasured: todayStr,
        isEstimated: false,
      },
      calves: {
        id: "calves",
        name: "Panturrilhas",
        currentCm: calvesVal,
        janCm: calvesVal,
        aprCm: calvesVal,
        julCm: calvesVal,
        sepCm: calvesVal,
        trend: "stable",
        delta: "0 cm",
        lastMeasured: todayStr,
        isEstimated: false,
      },
    };

    const newMetrics: BodyMetrics = {
      ...bodyMetrics,
      weightKg: newWeight,
      heightCm: newHeight,
      bodyFatPercent: newFat,
      leanMassKg: Math.round(newWeight * (1 - newFat / 100) * 10) / 10,
      muscleMassKg: Math.round(newWeight * (1 - newFat / 100) * 0.73 * 10) / 10,
      visceralFat: estimations.visceralFat,
      isEstimated: false,
      regions: updatedRegions,
      evolution: [
        ...(bodyMetrics.evolution || []),
        {
          period: "ATUAL",
          date: new Date().toISOString().split("T")[0],
          weightKg: newWeight,
          bodyFatPercent: newFat,
          muscleMassKg: Math.round(newWeight * (1 - newFat / 100) * 0.73 * 10) / 10,
          waistCm: waistVal,
          chestCm: chestVal,
          armCm: armRVal,
        },
      ],
    };

    onUpdateBodyMetrics(newMetrics);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsEditorOpen(false);
    }, 1500);
  };

  // Reset to auto-estimations
  const handleResetToAutoEstimations = () => {
    if (!onUpdateBodyMetrics) return;
    setFormFat("");
    const newMetrics: BodyMetrics = {
      ...bodyMetrics,
      bodyFatPercent: 0,
      isEstimated: true,
      regions: {},
    };
    onUpdateBodyMetrics(newMetrics);
  };

  // Hotspots for anatomical regions
  const hotspots: { id: string; label: string; x: number; y: number; view: ViewAngle[] }[] = [
    { id: "neck", label: "Pescoço", x: 50, y: 15, view: ["front", "side", "back"] },
    { id: "chest", label: "Peitoral", x: 50, y: 28, view: ["front", "side"] },
    { id: "arm_right", label: "Braço D", x: 20, y: 35, view: ["front", "back", "side"] },
    { id: "arm_left", label: "Braço E", x: 80, y: 35, view: ["front", "back"] },
    { id: "abdomen", label: "Abdômen", x: 50, y: 41, view: ["front", "side"] },
    { id: "waist", label: "Cintura", x: 50, y: 49, view: ["front", "back", "side"] },
    { id: "thigh_right", label: "Coxa D", x: 40, y: 64, view: ["front", "back", "side"] },
    { id: "thigh_left", label: "Coxa E", x: 60, y: 64, view: ["front", "back"] },
    { id: "calves", label: "Panturrilhas", x: 50, y: 82, view: ["front", "back", "side"] },
  ];

  // Dynamic silhouette scale factors based on active dimensions
  const activeWaist = getRegionData("waist").currentCm;
  const activeChest = getRegionData("chest").currentCm;
  const activeArm = getRegionData("arm_right").currentCm;
  const activeThigh = getRegionData("thigh_right").currentCm;

  const waistFactor = Math.min(1.25, Math.max(0.8, activeWaist / (height * 0.44)));
  const chestFactor = Math.min(1.25, Math.max(0.8, activeChest / (height * 0.575)));
  const armFactor = Math.min(1.3, Math.max(0.8, activeArm / (height * 0.185)));
  const thighFactor = Math.min(1.3, Math.max(0.8, activeThigh / (height * 0.32)));

  // SVG Scaled points
  const chestLeft = Math.round(100 - 38 * chestFactor);
  const chestRight = Math.round(100 + 38 * chestFactor);
  const waistLeft = Math.round(100 - 25 * waistFactor);
  const waistRight = Math.round(100 + 25 * waistFactor);

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800 pb-2.5 gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">
              CORPO & SILHUETA 3D // AVATAR DO OPERADOR
            </span>
            {selectedRegion.isEstimated && (
              <span className="px-1.5 py-0.2 text-[9px] font-mono border border-zinc-700 bg-zinc-900 text-zinc-300">
                [AUTO-CALCULADO]
              </span>
            )}
          </div>
          <h2 className="font-hud font-bold text-xl sm:text-2xl text-white tracking-wider flex items-center gap-2">
            MAPEAMENTO CORPORAL & BIOMETRIA
          </h2>
        </div>

        {/* Action Button: Dedicated Measurement Provider / Editor */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditorOpen(!isEditorOpen)}
            className="px-3 py-1.5 bg-white text-black font-mono font-bold text-xs uppercase tracking-wider hover:bg-zinc-200 transition-all flex items-center gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{isEditorOpen ? "FECHAR EDITOR" : "FORNECER / EDITAR MEDIDAS"}</span>
            {isEditorOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Dedicated Section / Apartado to input user measurements */}
      {isEditorOpen && (
        <form
          onSubmit={handleSaveMeasurements}
          className="bg-black border border-white p-4 sm:p-5 space-y-4 relative"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800 pb-3 gap-2">
            <div>
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">
                ENTRADA DE MEDIDAS ANTROPOMÉTRICAS
              </span>
              <h3 className="text-sm font-mono font-bold text-white uppercase">
                Atualize suas medidas reais para calibrar a silhueta
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <button
                type="button"
                onClick={handleResetToAutoEstimations}
                className="px-2.5 py-1 border border-zinc-800 text-zinc-400 hover:text-white text-[11px] flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Usar Estimativas do Sistema</span>
              </button>
            </div>
          </div>

          {/* Grid of Inputs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div>
              <label className="text-[10px] text-zinc-400 uppercase block mb-1">Peso (kg)</label>
              <input
                type="number"
                step="0.1"
                value={formWeight}
                onChange={(e) => setFormWeight(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2 text-white font-mono focus:border-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-zinc-400 uppercase block mb-1">Altura (cm)</label>
              <input
                type="number"
                value={formHeight}
                onChange={(e) => setFormHeight(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2 text-white font-mono focus:border-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-zinc-400 uppercase block mb-1">% Gordura (opcional)</label>
              <input
                type="number"
                step="0.1"
                placeholder={`Auto (~${estimations.fatPercent}%)`}
                value={formFat}
                onChange={(e) => setFormFat(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2 text-white font-mono focus:border-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-zinc-400 uppercase block mb-1">Peitoral (cm)</label>
              <input
                type="number"
                step="0.5"
                value={formChest}
                onChange={(e) => setFormChest(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2 text-white font-mono focus:border-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-zinc-400 uppercase block mb-1">Abdômen (cm)</label>
              <input
                type="number"
                step="0.5"
                value={formAbdomen}
                onChange={(e) => setFormAbdomen(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2 text-white font-mono focus:border-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-zinc-400 uppercase block mb-1">Cintura (cm)</label>
              <input
                type="number"
                step="0.5"
                value={formWaist}
                onChange={(e) => setFormWaist(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2 text-white font-mono focus:border-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-zinc-400 uppercase block mb-1">Braço Direito (cm)</label>
              <input
                type="number"
                step="0.5"
                value={formArmR}
                onChange={(e) => setFormArmR(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2 text-white font-mono focus:border-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-zinc-400 uppercase block mb-1">Coxa Direita (cm)</label>
              <input
                type="number"
                step="0.5"
                value={formThighR}
                onChange={(e) => setFormThighR(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2 text-white font-mono focus:border-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-zinc-400 uppercase block mb-1">Panturrilha (cm)</label>
              <input
                type="number"
                step="0.5"
                value={formCalves}
                onChange={(e) => setFormCalves(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2 text-white font-mono focus:border-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-zinc-400 uppercase block mb-1">Pescoço (cm)</label>
              <input
                type="number"
                step="0.5"
                value={formNeck}
                onChange={(e) => setFormNeck(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2 text-white font-mono focus:border-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-zinc-900">
            {saveSuccess ? (
              <span className="text-xs font-mono text-white flex items-center gap-1.5">
                <Check className="w-4 h-4" /> MEDIDAS SALVAS! SILHUETA RECALIBRADA.
              </span>
            ) : (
              <span className="text-[11px] font-mono text-zinc-500">
                Campos vazios utilizarão estimativas baseadas em altura, peso e idade.
              </span>
            )}
            <button
              type="submit"
              className="px-4 py-2 bg-white text-black font-mono font-bold text-xs uppercase tracking-wider hover:bg-zinc-200"
            >
              SALVAR MEDIÇÕES REAIS
            </button>
          </div>
        </form>
      )}

      {/* Main Grid: Body Model Interactive Canvas + Body Map Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: The Interactive Body Model (Silhouette & Mesh) */}
        <div className="lg:col-span-7 bg-black border border-zinc-800 p-4 flex flex-col items-center relative overflow-hidden">
          {/* Top Bar Controls of the Model */}
          <div className="w-full flex items-center justify-between z-10 mb-2 border-b border-zinc-900 pb-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-zinc-950 border border-zinc-800 p-0.5 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setModelEngine("3d")}
                  className={`px-3 py-1 flex items-center gap-1.5 transition-all ${
                    modelEngine === "3d"
                      ? "bg-white text-black font-bold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Box className="w-3.5 h-3.5" />
                  <span>3D REALISTA</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModelEngine("2d")}
                  className={`px-3 py-1 transition-all ${
                    modelEngine === "2d"
                      ? "bg-white text-black font-bold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  MAPA 2D
                </button>
              </div>

              {/* Gender selector for 3D/2D anatomical model */}
              <div className="flex items-center bg-zinc-950 border border-zinc-800 p-0.5 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => {
                    const updated = {
                      ...bodyMetrics,
                      gender: "male" as const,
                    };
                    onUpdateBodyMetrics(updated);
                  }}
                  className={`px-2.5 py-1 transition-all ${
                    gender === "male"
                      ? "bg-white text-black font-bold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                  title="Silhueta Masculina"
                >
                  MASCULINO
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const updated = {
                      ...bodyMetrics,
                      gender: "female" as const,
                    };
                    onUpdateBodyMetrics(updated);
                  }}
                  className={`px-2.5 py-1 transition-all ${
                    gender === "female"
                      ? "bg-white text-black font-bold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                  title="Silhueta Feminina"
                >
                  FEMININO
                </button>
              </div>

              {modelEngine === "2d" && (
                <div className="hidden sm:flex items-center gap-1 bg-black border border-zinc-800 p-0.5 text-xs font-mono">
                  <button
                    onClick={() => setViewAngle("front")}
                    className={`px-2 py-1 transition-all ${
                      viewAngle === "front" ? "bg-white text-black font-bold" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    FRENTE
                  </button>
                  <button
                    onClick={() => setViewAngle("side")}
                    className={`px-2 py-1 transition-all ${
                      viewAngle === "side" ? "bg-white text-black font-bold" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    LATERAL
                  </button>
                  <button
                    onClick={() => setViewAngle("back")}
                    className={`px-2 py-1 transition-all ${
                      viewAngle === "back" ? "bg-white text-black font-bold" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    COSTAS
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
              <Crosshair className="w-3.5 h-3.5 text-zinc-300" />
              <span>{modelEngine === "3d" ? "THREE.JS GL" : "MAPA SVG"}</span>
            </div>
          </div>

          {/* Conditional Display: 3D Realistic Model vs 2D Anatomical Map */}
          {modelEngine === "3d" ? (
            <div className="w-full flex flex-col items-center">
              <Body3DCanvas
                metrics={{
                  heightCm: height,
                  weightKg: weight,
                  bodyFatPercent: estimations.fatPercent,
                  gender: (gender === "female" ? "female" : "male"),
                  chestCm: bodyMetrics.regions?.chest?.currentCm || estimations.estimatedCircumferences.chest,
                  waistCm: bodyMetrics.regions?.waist?.currentCm || estimations.estimatedCircumferences.waist,
                  armCm: bodyMetrics.regions?.arm_right?.currentCm || estimations.estimatedCircumferences.arm_right,
                  thighCm: bodyMetrics.regions?.thigh_right?.currentCm || estimations.estimatedCircumferences.thigh_right,
                  calvesCm: bodyMetrics.regions?.calves?.currentCm || estimations.estimatedCircumferences.calves,
                }}
                selectedRegionId={selectedRegionId}
                onSelectRegion={(reg) => setSelectedRegionId(reg)}
                stealthMode={stealthMode}
              />
            </div>
          ) : (
            <>
              {/* SVG Anatomical Wireframe Canvas */}
              <div className="relative w-full max-w-[340px] h-[390px] flex items-center justify-center my-2">
                {/* Background circular radar grid */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                  <div className="w-72 h-72 rounded-full border border-zinc-600 border-dashed" />
                  <div className="absolute w-48 h-48 rounded-full border border-zinc-600" />
                  <div className="absolute w-24 h-24 rounded-full border border-zinc-600" />
                </div>

                {/* Anatomical Silhouette SVG rendered mathematically */}
                <svg
                  viewBox="0 0 200 420"
                  className="w-full h-full max-h-[380px] drop-shadow-lg z-0"
                  style={{
                    transform: `rotateY(${rotationAngle}deg)`,
                    transition: "transform 0.15s ease-out",
                  }}
                >
                  <defs>
                    <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#18181b" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#09090b" stopOpacity="1" />
                    </linearGradient>
                  </defs>

                  {/* View angle silhouettes */}
                  {viewAngle === "front" && (
                    <g>
                      {/* Head */}
                      <ellipse cx="100" cy="38" rx="18" ry="24" fill="url(#bodyGrad)" stroke="#3f3f46" strokeWidth="1.5" />
                      {/* Neck */}
                      <path d="M92 60 L92 74 L108 74 L108 60 Z" fill="url(#bodyGrad)" stroke="#3f3f46" strokeWidth="1.5" />
                      {/* Torso & Shoulders dynamically scaled */}
                      <path
                        d={`M${chestLeft} 78 Q100 82 ${chestRight} 78 L${chestRight + 6} 122 Q130 145 ${waistRight} 175 L${waistLeft} 175 Q70 145 ${chestLeft - 6} 122 Z`}
                        fill="url(#bodyGrad)"
                        stroke={selectedRegionId === "chest" || selectedRegionId === "abdomen" || selectedRegionId === "waist" ? "#ffffff" : "#52525b"}
                        strokeWidth={selectedRegionId === "chest" || selectedRegionId === "abdomen" || selectedRegionId === "waist" ? "2.5" : "1.5"}
                      />
                      {/* Chest Definition lines */}
                      <path d="M74 108 Q100 118 126 108" stroke="#71717a" strokeWidth="1.2" fill="none" opacity="0.6" />
                      <line x1="100" y1="84" x2="100" y2="168" stroke="#52525b" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
                      {/* Abdomen abs definition */}
                      <path d="M84 130 Q100 134 116 130" stroke="#71717a" strokeWidth="1" fill="none" opacity="0.5" />
                      <path d="M86 148 Q100 152 114 148" stroke="#71717a" strokeWidth="1" fill="none" opacity="0.5" />
                      {/* Left & Right Arms dynamically scaled */}
                      <path
                        d={`M${chestLeft} 78 L${chestLeft - 18 * armFactor} 140 L${chestLeft - 22 * armFactor} 205 L${chestLeft - 12 * armFactor} 206 L${chestLeft - 4} 144 L${chestLeft + 4} 100 Z`}
                        fill="url(#bodyGrad)"
                        stroke={selectedRegionId === "arm_right" ? "#ffffff" : "#3f3f46"}
                        strokeWidth={selectedRegionId === "arm_right" ? "2.5" : "1.5"}
                      />
                      <path
                        d={`M${chestRight} 78 L${chestRight + 18 * armFactor} 140 L${chestRight + 22 * armFactor} 205 L${chestRight + 12 * armFactor} 206 L${chestRight + 4} 144 L${chestRight - 4} 100 Z`}
                        fill="url(#bodyGrad)"
                        stroke={selectedRegionId === "arm_left" ? "#ffffff" : "#3f3f46"}
                        strokeWidth={selectedRegionId === "arm_left" ? "2.5" : "1.5"}
                      />
                      {/* Pelvis & Hips */}
                      <path d={`M${waistLeft} 175 L${waistRight} 175 L${waistRight + 8} 208 L${waistLeft - 8} 208 Z`} fill="url(#bodyGrad)" stroke="#3f3f46" strokeWidth="1.5" />
                      {/* Legs dynamically scaled */}
                      <path
                        d={`M${waistLeft - 5} 208 L${waistLeft - 10 * thighFactor} 295 L${waistLeft - 7} 375 L${waistLeft - 19} 375 L${waistLeft - 23 * thighFactor} 295 L${waistLeft - 3} 208 Z`}
                        fill="url(#bodyGrad)"
                        stroke={selectedRegionId === "thigh_right" || selectedRegionId === "calves" ? "#ffffff" : "#3f3f46"}
                        strokeWidth={selectedRegionId === "thigh_right" || selectedRegionId === "calves" ? "2.5" : "1.5"}
                      />
                      <path
                        d={`M${waistRight + 5} 208 L${waistRight + 10 * thighFactor} 295 L${waistRight + 7} 375 L${waistRight + 19} 375 L${waistRight + 23 * thighFactor} 295 L${waistRight + 3} 208 Z`}
                        fill="url(#bodyGrad)"
                        stroke={selectedRegionId === "thigh_left" ? "#ffffff" : "#3f3f46"}
                        strokeWidth={selectedRegionId === "thigh_left" ? "2.5" : "1.5"}
                      />
                      {/* Feet */}
                      <path d="M56 375 L45 390 L68 390 L68 375 Z" fill="#18181b" stroke="#3f3f46" />
                      <path d="M144 375 L155 390 L132 390 L132 375 Z" fill="#18181b" stroke="#3f3f46" />
                    </g>
                  )}

                  {viewAngle === "side" && (
                    <g>
                      {/* Side Head */}
                      <circle cx="100" cy="38" r="22" fill="url(#bodyGrad)" stroke="#3f3f46" strokeWidth="1.5" />
                      {/* Side Torso with thoracic posture */}
                      <path
                        d={`M92 64 Q${82 - 6 * waistFactor} 110 ${88 - 5 * waistFactor} 175 L114 175 Q126 120 108 64 Z`}
                        fill="url(#bodyGrad)"
                        stroke={selectedRegionId === "abdomen" || selectedRegionId === "chest" ? "#ffffff" : "#3f3f46"}
                        strokeWidth={selectedRegionId === "abdomen" || selectedRegionId === "chest" ? "2.5" : "1.5"}
                      />
                      {/* Side Arm */}
                      <path d="M102 78 L96 150 L92 210 L104 210 L110 150 Z" fill="url(#bodyGrad)" stroke="#3f3f46" strokeWidth="1.5" />
                      {/* Side Leg */}
                      <path d="M88 175 L92 285 L95 375 L108 375 L112 285 L114 175 Z" fill="url(#bodyGrad)" stroke="#3f3f46" strokeWidth="1.5" />
                      <path d="M92 375 L80 390 L115 390 L108 375 Z" fill="#18181b" stroke="#3f3f46" />
                    </g>
                  )}

                  {viewAngle === "back" && (
                    <g>
                      {/* Back Head */}
                      <ellipse cx="100" cy="38" rx="18" ry="24" fill="url(#bodyGrad)" stroke="#3f3f46" strokeWidth="1.5" />
                      {/* Traps & Lats */}
                      <path
                        d={`M${chestLeft} 78 Q100 86 ${chestRight} 78 L${chestRight + 6} 126 Q128 145 ${waistRight} 175 L${waistLeft} 175 Q72 145 ${chestLeft - 6} 126 Z`}
                        fill="url(#bodyGrad)"
                        stroke="#52525b"
                        strokeWidth="1.5"
                      />
                      {/* Spine line */}
                      <line x1="100" y1="65" x2="100" y2="185" stroke="#71717a" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
                      {/* Arms */}
                      <path d={`M${chestLeft} 78 L${chestLeft - 18} 140 L${chestLeft - 22} 205 L${chestLeft - 12} 206 L${chestLeft - 4} 144 L${chestLeft + 4} 100 Z`} fill="url(#bodyGrad)" stroke="#3f3f46" strokeWidth="1.5" />
                      <path d={`M${chestRight} 78 L${chestRight + 18} 140 L${chestRight + 22} 205 L${chestRight + 12} 206 L${chestRight + 4} 144 L${chestRight - 4} 100 Z`} fill="url(#bodyGrad)" stroke="#3f3f46" strokeWidth="1.5" />
                      {/* Glutes */}
                      <path d={`M${waistLeft} 175 Q100 178 ${waistRight} 175 L${waistRight + 3} 214 Q100 220 ${waistLeft - 3} 214 Z`} fill="url(#bodyGrad)" stroke="#3f3f46" strokeWidth="1.5" />
                      {/* Legs back */}
                      <path d={`M${waistLeft - 3} 214 L66 295 L68 375 L56 375 L52 295 L${waistLeft} 214 Z`} fill="url(#bodyGrad)" stroke="#3f3f46" strokeWidth="1.5" />
                      <path d={`M${waistRight + 3} 214 L134 295 L132 375 L144 375 L148 295 L${waistRight} 214 Z`} fill="url(#bodyGrad)" stroke="#3f3f46" strokeWidth="1.5" />
                      {/* Feet */}
                      <path d="M54 375 L46 390 L68 390 L68 375 Z" fill="#18181b" stroke="#3f3f46" />
                      <path d="M144 375 L154 390 L132 390 L132 375 Z" fill="#18181b" stroke="#3f3f46" />
                    </g>
                  )}
                </svg>

                {/* Clickable Hotspot Markers mapped over anatomical coords */}
                {hotspots
                  .filter((h) => h.view.includes(viewAngle))
                  .map((spot) => {
                    const isSelected = selectedRegionId === spot.id;
                    return (
                      <button
                        key={spot.id}
                        onClick={() => setSelectedRegionId(spot.id)}
                        style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono uppercase transition-all z-20 border ${
                          isSelected
                            ? "bg-white text-black border-white font-bold"
                            : "bg-black/90 border-zinc-800 text-zinc-400 hover:border-zinc-500 hover:text-white"
                        }`}
                      >
                        <span className={`w-1 h-1 ${isSelected ? "bg-black" : "bg-white"}`} />
                        {spot.label}
                      </button>
                    );
                  })}
              </div>

              {/* 360° Azimuth Slider */}
              <div className="w-full flex items-center justify-between gap-3 px-2 pt-2 border-t border-zinc-800 z-10 text-[11px] font-mono text-zinc-400">
                <div className="flex items-center gap-1 font-mono uppercase">
                  <RotateCw className="w-3.5 h-3.5 text-zinc-400" />
                  <span>ROTAÇÃO 360°:</span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={rotationAngle}
                  onChange={(e) => setRotationAngle(Number(e.target.value))}
                  className="flex-1 accent-white h-1 bg-zinc-800 cursor-pointer"
                />
                <span className="font-mono text-xs font-bold text-white w-12 text-right">
                  {rotationAngle}°
                </span>
              </div>
            </>
          )}
        </div>

        {/* Right Column: BODY MAP Region Details & Historical Evolution */}
        <div className="lg:col-span-5 space-y-3 flex flex-col justify-between">
          {/* Selected Region Telemetry Card */}
          <div className="bg-black border border-zinc-800 p-4">
            <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest block">
                    REGIÃO SELECIONADA
                  </span>
                  {selectedRegion.isEstimated && (
                    <span className="text-[8px] font-mono px-1 border border-zinc-700 text-zinc-400">
                      ESTIMADO
                    </span>
                  )}
                </div>
                <h3 className="font-hud font-bold text-xl text-white tracking-wider">
                  {selectedRegion.name.toUpperCase()}
                </h3>
              </div>
              <span className="text-xs font-mono text-zinc-400 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-zinc-500" />
                {selectedRegion.lastMeasured}
              </span>
            </div>

            {/* Metric Display */}
            <div className="bg-zinc-950 border border-zinc-800 p-3 flex items-center justify-between mb-3">
              <div>
                <span className="text-[10px] font-mono text-zinc-400 block uppercase tracking-wider">
                  MEDIDA ATUAL
                </span>
                <span className="font-mono text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {selectedRegion.currentCm}{" "}
                  <span className="text-xs font-mono font-normal text-zinc-500">CM</span>
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono text-zinc-400 block uppercase tracking-wider">
                  TIPO DE DADO
                </span>
                <span className="font-mono text-xs text-zinc-300 font-bold block">
                  {selectedRegion.isEstimated ? "Cálculo Antropométrico" : "Medição Manual"}
                </span>
                <button
                  onClick={() => setIsEditorOpen(true)}
                  className="text-[10px] font-mono text-zinc-400 hover:text-white underline mt-1 block"
                >
                  Alterar valor
                </button>
              </div>
            </div>

            {/* Regional Proportions Info */}
            <div className="space-y-1.5 text-xs font-mono">
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">
                COMPARAÇÃO BIOMÉTRICA
              </span>
              <div className="grid grid-cols-2 gap-2 text-zinc-400 text-[11px]">
                <div className="p-2 border border-zinc-900 bg-black">
                  <span className="text-[9px] text-zinc-500 block uppercase">Razão p/ Altura</span>
                  <span className="text-white font-bold">
                    {Math.round((selectedRegion.currentCm / height) * 100)}%
                  </span>
                </div>
                <div className="p-2 border border-zinc-900 bg-black">
                  <span className="text-[9px] text-zinc-500 block uppercase">Status da Região</span>
                  <span className="text-zinc-200 font-bold">
                    {selectedRegion.isEstimated ? "Calculado via IMC" : "Medido Real"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Body Composition Indicators */}
          <div className="bg-black border border-zinc-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest block">
                ESTIMATIVA DE COMPOSIÇÃO CORPORAL
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                IMC: {estimations.bmi} kg/m²
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center font-mono">
              <div className="bg-zinc-950 border border-zinc-800 p-2.5">
                <span className="text-[9px] text-zinc-400 block font-mono uppercase">% GORDURA</span>
                <span className="text-xl font-bold text-white">
                  {estimations.fatPercent}%
                </span>
                <span className="text-[9px] text-zinc-500 block">
                  {estimations.isFatEstimated ? "Auto-calculado" : "Medido"}
                </span>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 p-2.5">
                <span className="text-[9px] text-zinc-400 block font-mono uppercase">MASSA MAGRA</span>
                <span className="text-xl font-bold text-white">
                  {estimations.leanMass} <span className="text-[10px] font-normal">KG</span>
                </span>
                <span className="text-[9px] text-zinc-500 block">
                  Músculo: ~{estimations.muscleMass}kg
                </span>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 p-2.5">
                <span className="text-[9px] text-zinc-400 block font-mono uppercase">GORD. VISCERAL</span>
                <span className="text-xl font-bold text-white">
                  NVL {estimations.visceralFat}
                </span>
                <span className="text-[9px] text-zinc-500 block">Faixa ideal: 1-9</span>
              </div>
            </div>
          </div>

          {/* Biometrics Summary & Quick Edit Link */}
          <div className="bg-black border border-zinc-800 p-3.5 flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-[10px] text-zinc-400 uppercase block">Biometria Ativa</span>
              <span className="text-white font-bold">
                {weight} kg • {height} cm • {age} anos ({gender === "male" ? "Masc" : "Fem"})
              </span>
            </div>
            <button
              onClick={() => setIsEditorOpen(true)}
              className="px-2.5 py-1 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 text-[11px]"
            >
              + Inserir Medidas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
