// GL HYDRATION ENGINE // LABCORE FLUID & ELECTROLYTE BALANCE
// Evidence-based physiological fluid estimation.
// Standards: ACSM (2007) Fluid Replacement; EFSA (2010); Armstrong et al. Urine Specific Gravity.
// Principle: Hydration recommendations based on body weight are an INITIAL ESTIMATE, NEVER an exact physiological requirement.

export interface HydrationContextInputs {
  weightKg?: number | null;
  ambientTemperatureC?: number; // Default: 22°C (moderate)
  exerciseDurationMinutes?: number; // Duration of planned/executed training
  sweatRateCategory?: "LOW" | "MODERATE" | "HIGH" | "VERY_HIGH"; // Individual perceived sweating
  useCreatine?: boolean; // Creatine draws intracellular water (+300-500ml)
  climateHumidity?: "DRY" | "NORMAL" | "HUMID"; // Dry climates increase respiratory water loss
  altitudeMeters?: number; // Higher altitude increases respiratory water loss
}

export interface HydrationEstimateResult {
  hasSufficientData: boolean;
  baselineRangeMl: { min: number; max: number } | null;
  totalEstimatedRangeMl: { min: number; max: number } | null;
  recommendedCenterMl: number | null;
  adjustments: {
    factor: string;
    description: string;
    additionalMlMin: number;
    additionalMlMax: number;
  }[];
  categoryLabel: string;
  disclaimer: string;
  armstrongGuidance: {
    colorLevel: number;
    description: string;
    hydrationStatus: "HYDRATED" | "EUIDRATED" | "DEHYDRATED" | "SEVERELY_DEHYDRATED";
    action: string;
  }[];
  scientificLimitations: string[];
}

export function calculateHydrationTarget(
  inputs: HydrationContextInputs
): HydrationEstimateResult {
  const {
    weightKg,
    ambientTemperatureC = 22,
    exerciseDurationMinutes = 0,
    sweatRateCategory = "MODERATE",
    useCreatine = false,
    climateHumidity = "NORMAL",
    altitudeMeters = 0,
  } = inputs;

  if (!weightKg || weightKg <= 0) {
    return {
      hasSufficientData: false,
      baselineRangeMl: null,
      totalEstimatedRangeMl: null,
      recommendedCenterMl: null,
      adjustments: [],
      categoryLabel: "AGUARDANDO BIOMETRIA",
      disclaimer: "Informe o peso corporal para gerar a faixa inicial estimada de hidratação.",
      armstrongGuidance: getArmstrongScale(),
      scientificLimitations: [
        "A necessidade hídrica é individual e varia com a taxa metabólica, composição corporal e clima.",
      ],
    };
  }

  // 1. Baseline physiological range (EFSA 2010 / ACSM: 30 a 35 ml por kg de peso corporal em repouso)
  const baseMin = Math.round(weightKg * 30);
  const baseMax = Math.round(weightKg * 35);

  const adjustments: HydrationEstimateResult["adjustments"] = [];

  // 2. Exercise Duration Adjustment (ACSM: 400 - 800 ml por hora de esforço dependendo da intensidade)
  let exerciseMin = 0;
  let exerciseMax = 0;
  if (exerciseDurationMinutes > 0) {
    const hours = exerciseDurationMinutes / 60;
    exerciseMin = Math.round(hours * 450);
    exerciseMax = Math.round(hours * 750);
    adjustments.push({
      factor: "Exercício Físico",
      description: `${exerciseDurationMinutes} min de treino ativo`,
      additionalMlMin: exerciseMin,
      additionalMlMax: exerciseMax,
    });
  }

  // 3. Thermal Ambient Adjustment
  let tempMin = 0;
  let tempMax = 0;
  if (ambientTemperatureC >= 30) {
    tempMin = 400;
    tempMax = 800;
    adjustments.push({
      factor: "Calor Intenso",
      description: `Temperatura de ${ambientTemperatureC}°C (termorregulação e evaporação aumentadas)`,
      additionalMlMin: tempMin,
      additionalMlMax: tempMax,
    });
  } else if (ambientTemperatureC >= 25) {
    tempMin = 200;
    tempMax = 400;
    adjustments.push({
      factor: "Ambiente Aquecido",
      description: `Temperatura de ${ambientTemperatureC}°C`,
      additionalMlMin: tempMin,
      additionalMlMax: tempMax,
    });
  }

  // 4. Individual Sweat Rate (Taxa de Sudorese Individual)
  let sweatMin = 0;
  let sweatMax = 0;
  if (sweatRateCategory === "HIGH") {
    sweatMin = 250;
    sweatMax = 500;
    adjustments.push({
      factor: "Taxa de Sudorese Alta",
      description: "Perfil de sudorese profusa durante esforços",
      additionalMlMin: sweatMin,
      additionalMlMax: sweatMax,
    });
  } else if (sweatRateCategory === "VERY_HIGH") {
    sweatMin = 500;
    sweatMax = 900;
    adjustments.push({
      factor: "Taxa de Sudorese Muito Alta",
      description: "Histórico de alta perda hidroeletrolítica por transpiração",
      additionalMlMin: sweatMin,
      additionalMlMax: sweatMax,
    });
  }

  // 5. Context Factors: Creatina, Clima Seco, Altitude
  let contextMin = 0;
  let contextMax = 0;
  if (useCreatine) {
    contextMin += 300;
    contextMax += 500;
    adjustments.push({
      factor: "Uso de Creatina",
      description: "Hidratação osmótica intracelular muscular aumentada",
      additionalMlMin: 300,
      additionalMlMax: 500,
    });
  }

  if (climateHumidity === "DRY") {
    contextMin += 200;
    contextMax += 400;
    adjustments.push({
      factor: "Clima Seco",
      description: "Maior perda insensível de vapor de água pelas vias aéreas",
      additionalMlMin: 200,
      additionalMlMax: 400,
    });
  }

  if (altitudeMeters > 1500) {
    contextMin += 250;
    contextMax += 500;
    adjustments.push({
      factor: "Altitude (>1500m)",
      description: "Hiperventilação e ar rarefeito aumentam a perda respiratória",
      additionalMlMin: 250,
      additionalMlMax: 500,
    });
  }

  const totalMin = baseMin + exerciseMin + tempMin + sweatMin + contextMin;
  const totalMax = baseMax + exerciseMax + tempMax + sweatMax + contextMax;
  const recommendedCenter = Math.round((totalMin + totalMax) / 2);

  return {
    hasSufficientData: true,
    baselineRangeMl: { min: baseMin, max: baseMax },
    totalEstimatedRangeMl: { min: totalMin, max: totalMax },
    recommendedCenterMl: recommendedCenter,
    adjustments,
    categoryLabel: "FAIXA INICIAL ESTIMADA",
    disclaimer:
      "A faixa calculada é uma estimativa de ponto de partida com base em diretrizes científicas populacionais (ACSM / EFSA), nunca uma necessidade fisiológica exata. Ajuste conforme sede e a Escala de Coloração da Urina de Armstrong.",
    armstrongGuidance: getArmstrongScale(),
    scientificLimitations: [
      "A taxa de sudorese varia entre 0.4 e 2.5 litros/hora em diferentes atletas.",
      "A hiper-hidratação sem eletrólitos (sódio) pode levar a hiponatremia em esforços prolongados (>3h).",
      "Alimentos com alto teor hídrico (frutas e vegetais) contribuem com cerca de 20% do aporte hídrico diário.",
    ],
  };
}

export function getArmstrongScale() {
  return [
    {
      colorLevel: 1,
      description: "Transparente ou palha muito claro",
      hydrationStatus: "HYDRATED" as const,
      action: "Hidratação ótima. Mantenha ingestão natural conforme sede.",
    },
    {
      colorLevel: 2,
      description: "Amarelo palha claro",
      hydrationStatus: "EUIDRATED" as const,
      action: "Euidratação adequada. Ingestão equilibrada.",
    },
    {
      colorLevel: 3,
      description: "Amarelo límpido",
      hydrationStatus: "EUIDRATED" as const,
      action: "Hidratação regular. Beba 1 copo de água.",
    },
    {
      colorLevel: 4,
      description: "Amarelo escuro",
      hydrationStatus: "DEHYDRATED" as const,
      action: "Desidratação leve. Beba 300 a 500 ml nas próximas 2 horas.",
    },
    {
      colorLevel: 5,
      description: "Âmbar ou chá forte",
      hydrationStatus: "SEVERELY_DEHYDRATED" as const,
      action: "Desidratação moderada/severa. Aporte hídrico imediato de 500-800 ml.",
    },
  ];
}
