// GL SCIENTIFIC ENGINE // LABCORE
// Documented, deterministic scientific formulas for training, nutrition, body comp & recovery.
// All calculations are explicit, testable, and separate from UI and AI layers.

import { FormulaDocumentation } from "./provenance";

export interface BMRCalculationResult {
  bmrKcal: number;
  method: "Mifflin-St Jeor" | "Katch-McArdle";
  inputs: { weightKg: number; heightCm: number; age: number; gender: "male" | "female"; bodyFatPercent?: number };
  limitations: string;
}

export interface TDEECalculationResult {
  tdeeKcal: number;
  bmrKcal: number;
  activityMultiplier: number;
  activityLevel: "SEDENTARY" | "MODERATE" | "HIGH" | "ATHLETE";
  limitations: string;
}

export interface MacroSplitResult {
  calories: number;
  proteinG: number;
  proteinKcal: number;
  carbsG: number;
  carbsKcal: number;
  fatG: number;
  fatKcal: number;
  fiberG: number;
  formula: string;
}

export interface OneRMEstimationResult {
  reps: number;
  weightKg: number;
  epley1RM: number;
  brzycki1RM: number;
  average1RM: number;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  limitations: string;
}

export interface HeartRateZonesResult {
  maxHrBpm: number;
  restingHrBpm?: number;
  method: "Gellish" | "Fox" | "Karvonen";
  zones: {
    zone1: { name: string; minBpm: number; maxBpm: number; description: string };
    zone2: { name: string; minBpm: number; maxBpm: number; description: string };
    zone3: { name: string; minBpm: number; maxBpm: number; description: string };
    zone4: { name: string; minBpm: number; maxBpm: number; description: string };
    zone5: { name: string; minBpm: number; maxBpm: number; description: string };
  };
}

// ----------------------------------------------------
// FORMULA DIRECTORY & DOCUMENTATION
// ----------------------------------------------------
export const SCIENTIFIC_FORMULAS_DOCS: Record<string, FormulaDocumentation> = {
  BMI: {
    name: "Índice de Massa Corporal (IMC / Quetelet)",
    formula: "BMI = weightKg / (heightM)²",
    inputs: ["weightKg", "heightM"],
    output: "BMI (kg/m²)",
    limitations: "Não diferencia massa muscular de tecido adiposo, nem reflete distribuição regional de gordura.",
    scientificReferences: ["Quetelet, A. (1835). Sur l'homme et le développement de ses facultés."],
  },
  BMR_MIFFLIN: {
    name: "Taxa Metabólica Basal (Mifflin-St Jeor)",
    formula: "Homem: 10×W + 6.25×H - 5×A + 5 | Mulher: 10×W + 6.25×H - 5×A - 161",
    inputs: ["weightKg", "heightCm", "age", "gender"],
    output: "BMR (kcal/dia)",
    limitations: "Assume composição corporal típica para a população; pode subestimar em atletas hipertrofiados.",
    scientificReferences: ["Mifflin, M. D., et al. (1990). The American Journal of Clinical Nutrition."],
  },
  BMR_KATCH: {
    name: "Taxa Metabólica Basal (Katch-McArdle)",
    formula: "BMR = 370 + 21.6 × (weightKg × (1 - bodyFatPercent/100))",
    inputs: ["weightKg", "bodyFatPercent"],
    output: "BMR (kcal/dia)",
    limitations: "Depende da precisão prévia da aferição do percentual de gordura.",
    scientificReferences: ["McArdle, W. D., Katch, F. I., & Katch, V. L. (2006). Exercise Physiology."],
  },
  ONE_REP_MAX_EPLEY: {
    name: "Estimativa de 1 Repetição Máxima (Epley)",
    formula: "1RM = weightKg × (1 + reps / 30)",
    inputs: ["weightKg", "reps"],
    output: "1RM estimado (kg)",
    limitations: "Alta precisão entre 1 e 10 repetições. A incerteza aumenta significativamente acima de 12 repetições.",
    scientificReferences: ["Epley, B. (1985). Poundage chart. Boyd Epley Workout."],
  },
  HEART_RATE_GELLISH: {
    name: "Frequência Cardíaca Máxima (Gellish et al.)",
    formula: "FCmax = 207 - (0.7 × age)",
    inputs: ["age"],
    output: "FCmax (bpm)",
    limitations: "Desvio padrão populacional de ±10 a 12 bpm. Teste ergoespirométrico é o padrão-ouro.",
    scientificReferences: ["Gellish, R. L., et al. (2007). Med Sci Sports Exerc."],
  },
  TRAINING_VOLUME: {
    name: "Volume Mecânico Total",
    formula: "Volume = ∑ (séries × repetições × carga em kg)",
    inputs: ["sets", "reps", "weightKg"],
    output: "Tonelagem total (kg)",
    limitations: "Aplicável estritamente a exercícios com sobrecarga externa direta; não deve ser misturado com exercícios de peso corporal sem lastro.",
    scientificReferences: ["Schoenfeld, B. J., et al. (2019). Dose-response relationship between weekly resistance training volume."],
  },
};

// ----------------------------------------------------
// DETERMINISTIC CALCULATORS
// ----------------------------------------------------

export function calculateBMI(weightKg: number, heightCm: number): { value: number; category: string; limitations: string } {
  if (!weightKg || !heightCm || heightCm <= 0) {
    return { value: 0, category: "INSUFFICIENT_DATA", limitations: "Dados insuficientes." };
  }
  const heightM = heightCm / 100;
  const bmi = Math.round((weightKg / (heightM * heightM)) * 10) / 10;
  let category = "Normal";
  if (bmi < 18.5) category = "Abaixo do peso";
  else if (bmi < 24.9) category = "Eutrófico (Normal)";
  else if (bmi < 29.9) category = "Sobrepeso";
  else if (bmi < 34.9) category = "Obesidade Grau I";
  else category = "Obesidade Grau II+";

  return {
    value: bmi,
    category,
    limitations: SCIENTIFIC_FORMULAS_DOCS.BMI.limitations,
  };
}

// Deurenberg clinical body fat formula (1991): BF% = (1.20 × BMI) + (0.23 × Age) - (10.8 × sex) - 5.4 (sex: male=1, female=0)
export function calculateDeurenbergBodyFat(
  bmi: number,
  age: number,
  gender: "male" | "female"
): { value: number; limitations: string } {
  const sexFactor = gender === "male" ? 1 : 0;
  const rawFat = 1.2 * bmi + 0.23 * age - 10.8 * sexFactor - 5.4;
  const boundedFat = Math.max(5, Math.min(50, Math.round(rawFat * 10) / 10));
  return {
    value: boundedFat,
    limitations: "Fórmula de Deurenberg baseada em regressão populacional de IMC e idade. Variações anatômicas individuais exigem DEXA ou plicometria para precisão padrão-ouro.",
  };
}

// Multi-compartment body composition estimation based on total weight and fat percentage
export function calculateBodyComposition(
  weightKg: number,
  bodyFatPercent: number
): {
  fatMassKg: number;
  leanMassKg: number;
  skeletalMuscleMassKg: number;
} {
  const fatMassKg = Math.round((weightKg * (bodyFatPercent / 100)) * 10) / 10;
  const leanMassKg = Math.round((weightKg - fatMassKg) * 10) / 10;
  // Skeletal muscle mass accounts for approximately 50-54% of fat-free mass in adult humans (Janssen et al.)
  const skeletalMuscleMassKg = Math.round((leanMassKg * 0.52) * 10) / 10;

  return {
    fatMassKg,
    leanMassKg,
    skeletalMuscleMassKg,
  };
}

export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: "male" | "female",
  bodyFatPercent?: number
): BMRCalculationResult {
  // If verified body fat exists, prioritize Katch-McArdle for lean mass precision
  if (bodyFatPercent && bodyFatPercent > 4 && bodyFatPercent < 55) {
    const leanMassKg = weightKg * (1 - bodyFatPercent / 100);
    const bmrKcal = Math.round(370 + 21.6 * leanMassKg);
    return {
      bmrKcal,
      method: "Katch-McArdle",
      inputs: { weightKg, heightCm, age, gender, bodyFatPercent },
      limitations: SCIENTIFIC_FORMULAS_DOCS.BMR_KATCH.limitations,
    };
  }

  // Fallback: Standard Mifflin-St Jeor
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const bmrKcal = Math.round(gender === "male" ? base + 5 : base - 161);
  return {
    bmrKcal,
    method: "Mifflin-St Jeor",
    inputs: { weightKg, heightCm, age, gender },
    limitations: SCIENTIFIC_FORMULAS_DOCS.BMR_MIFFLIN.limitations,
  };
}

export function calculateTDEE(
  bmrKcal: number,
  activityLevel: "SEDENTARY" | "MODERATE" | "HIGH" | "ATHLETE"
): TDEECalculationResult {
  const multipliers: Record<string, number> = {
    SEDENTARY: 1.2,
    MODERATE: 1.45,
    HIGH: 1.65,
    ATHLETE: 1.85,
  };
  const multiplier = multipliers[activityLevel] || 1.45;
  const tdeeKcal = Math.round(bmrKcal * multiplier);
  return {
    tdeeKcal,
    bmrKcal,
    activityMultiplier: multiplier,
    activityLevel,
    limitations: "Fatores de atividade utilizam coeficientes FAO/OMS. Podem oscilar conforme NEAT (termogênese sem exercício).",
  };
}

export function calculateTargetCalories(
  tdeeKcal: number,
  goal: "STRENGTH" | "HYPERTROPHY" | "ENDURANCE" | "RECOMPOSITION" | "HEALTH_LONGEVITY"
): { targetCalories: number; adjustmentKcal: number; rationale: string } {
  let adjustmentKcal = 0;
  let rationale = "Manutenção isocalórica para suporte metabólico geral.";

  switch (goal) {
    case "HYPERTROPHY":
    case "STRENGTH":
      adjustmentKcal = 300; // Superávit limpo moderado
      rationale = "Superávit energético de +300 kcal/dia para sustentar a síntese proteica miofibrilar sem acúmulo excessivo de adiposidade.";
      break;
    case "RECOMPOSITION":
      adjustmentKcal = -150; // Leve déficit
      rationale = "Déficit controlado de -150 kcal/dia para estimular a oxidação lipídica com preservação e ganho de massa magra sob estímulo de treino de força.";
      break;
    case "ENDURANCE":
      adjustmentKcal = 150;
      rationale = "Suporte para reposição de glicogênio muscular em sessões aeróbicas prolongadas.";
      break;
    case "HEALTH_LONGEVITY":
    default:
      adjustmentKcal = 0;
      break;
  }

  return {
    targetCalories: Math.max(1200, tdeeKcal + adjustmentKcal),
    adjustmentKcal,
    rationale,
  };
}

export function calculateMacroSplit(
  weightKg: number,
  targetCalories: number,
  goal: "STRENGTH" | "HYPERTROPHY" | "ENDURANCE" | "RECOMPOSITION" | "HEALTH_LONGEVITY"
): MacroSplitResult {
  // Protein recommendation: 1.8g to 2.2g per kg bodyweight
  let proteinFactor = 2.0;
  if (goal === "HYPERTROPHY" || goal === "RECOMPOSITION") proteinFactor = 2.2;
  else if (goal === "ENDURANCE") proteinFactor = 1.6;

  const proteinG = Math.round(weightKg * proteinFactor);
  const proteinKcal = proteinG * 4;

  // Dietary Fat: 0.8g to 1.0g per kg bodyweight (minimum 20% total energy for hormonal support)
  const fatG = Math.round(Math.max(weightKg * 0.85, (targetCalories * 0.25) / 9));
  const fatKcal = fatG * 9;

  // Remaining calories to carbohydrates
  const remainingKcal = Math.max(0, targetCalories - (proteinKcal + fatKcal));
  const carbsG = Math.round(remainingKcal / 4);
  const carbsKcal = carbsG * 4;

  // Dietary Fiber: ~14g per 1000 kcal (IOM recommendation)
  const fiberG = Math.round((targetCalories / 1000) * 14);

  return {
    calories: targetCalories,
    proteinG,
    proteinKcal,
    carbsG,
    carbsKcal,
    fatG,
    fatKcal,
    fiberG,
    formula: `Proteína: ${proteinFactor}g/kg | Gorduras: 25% GET | Carboidratos: remanescente calórico | Fibras: 14g/1000kcal`,
  };
}

export function estimate1RM(weightKg: number, reps: number): OneRMEstimationResult {
  if (reps <= 0 || weightKg <= 0) {
    return {
      reps,
      weightKg,
      epley1RM: 0,
      brzycki1RM: 0,
      average1RM: 0,
      confidence: "LOW",
      limitations: "Carga ou repetições zeradas.",
    };
  }

  if (reps === 1) {
    return {
      reps: 1,
      weightKg,
      epley1RM: weightKg,
      brzycki1RM: weightKg,
      average1RM: weightKg,
      confidence: "HIGH",
      limitations: "Repetição única máxima aferida diretamente.",
    };
  }

  // Epley: weight * (1 + reps/30)
  const epley = Math.round(weightKg * (1 + reps / 30));
  // Brzycki: weight * (36 / (37 - reps))
  const brzycki = reps < 37 ? Math.round(weightKg * (36 / (37 - reps))) : epley;
  const average = Math.round((epley + brzycki) / 2);

  let confidence: "HIGH" | "MEDIUM" | "LOW" = "HIGH";
  if (reps > 6 && reps <= 12) confidence = "MEDIUM";
  else if (reps > 12) confidence = "LOW";

  return {
    reps,
    weightKg,
    epley1RM: epley,
    brzycki1RM: brzycki,
    average1RM: average,
    confidence,
    limitations: "Estimativas acima de 10 repetições têm maior dispersão por fatores de resistência à fadiga muscular.",
  };
}

// Alias for 1RM calculation compatible with components
export function calculate1RM(weightKg: number, reps: number): { estimated1RM: number; formula: string } {
  const result = estimate1RM(weightKg, reps);
  return {
    estimated1RM: result.epley1RM,
    formula: `Epley: ${weightKg} × (1 + ${reps}/30)`,
  };
}

export function calculateHeartRateZones(
  age: number,
  customMaxHr?: number,
  restingHr?: number
): HeartRateZonesResult {
  const maxHrBpm = customMaxHr && customMaxHr > 100 ? customMaxHr : Math.round(207 - 0.7 * age);
  const method = customMaxHr ? "Fox" : "Gellish";

  // If resting HR is provided and Karvonen is desired (Heart Rate Reserve)
  if (restingHr && restingHr > 35 && restingHr < 110) {
    const hrr = maxHrBpm - restingHr;
    const calcZ = (pctMin: number, pctMax: number) => ({
      minBpm: Math.round(restingHr + hrr * pctMin),
      maxBpm: Math.round(restingHr + hrr * pctMax),
    });
    return {
      maxHrBpm,
      restingHrBpm: restingHr,
      method: "Karvonen",
      zones: {
        zone1: { name: "Recuperação Ativa (Z1)", ...calcZ(0.5, 0.6), description: "50-60% Reserva Cardíaca" },
        zone2: { name: "Resistência Aeróbica (Z2)", ...calcZ(0.6, 0.7), description: "60-70% Reserva Cardíaca" },
        zone3: { name: "Ritmo / Tempo (Z3)", ...calcZ(0.7, 0.8), description: "70-80% Reserva Cardíaca" },
        zone4: { name: "Limiar Anaeróbico (Z4)", ...calcZ(0.8, 0.9), description: "80-90% Reserva Cardíaca" },
        zone5: { name: "Potência Máxima (Z5)", ...calcZ(0.9, 1.0), description: "90-100% Reserva Cardíaca" },
      },
    };
  }

  // Standard % FCmax
  return {
    maxHrBpm,
    method,
    zones: {
      zone1: { name: "Recuperação Ativa (Z1)", minBpm: Math.round(maxHrBpm * 0.5), maxBpm: Math.round(maxHrBpm * 0.6), description: "50-60% FCmax" },
      zone2: { name: "Resistência Aeróbica (Z2)", minBpm: Math.round(maxHrBpm * 0.6), maxBpm: Math.round(maxHrBpm * 0.7), description: "60-70% FCmax" },
      zone3: { name: "Ritmo / Tempo (Z3)", minBpm: Math.round(maxHrBpm * 0.7), maxBpm: Math.round(maxHrBpm * 0.8), description: "70-80% FCmax" },
      zone4: { name: "Limiar Anaeróbico (Z4)", minBpm: Math.round(maxHrBpm * 0.8), maxBpm: Math.round(maxHrBpm * 0.9), description: "80-90% FCmax" },
      zone5: { name: "Potência Máxima (Z5)", minBpm: Math.round(maxHrBpm * 0.9), maxBpm: maxHrBpm, description: "90-100% FCmax" },
    },
  };
}

export function calculateWaterRecommendation(weightKg: number): { targetMl: number; rationale: string } {
  const targetMl = Math.round(weightKg * 35);
  return {
    targetMl: Math.max(1500, Math.min(6000, targetMl)),
    rationale: "Estimativa calculada com base na recomendação clínica de 35 ml por kg de peso corporal/dia.",
  };
}
