// GL NUTRITION ENGINE // LABCORE METABOLISM & DIETETICS
// Evidence-based physiological macronutrient and hydration ranges.
// Standards: Morton et al. (2018), Helms et al. (2014), ACSM (2007), EFSA (2010).

export interface NutritionalTargetsResult {
  isConfigured: boolean;
  bmrKcal: number | null;
  bmrFormulaUsed: "Mifflin-St Jeor" | "Katch-McArdle" | null;
  tdeeEstimatedKcal: { min: number; max: number; average: number } | null;
  tdeeBreakdown: {
    basalKcal: number;
    neatKcal: number;
    eatKcal: number;
    tefKcal: number;
  } | null;
  calorieTargetRange: { min: number; max: number; recommended: number } | null;
  proteinRangeG: { min: number; max: number; gPerKgMin: number; gPerKgMax: number } | null;
  carbsRangeG: { min: number; max: number } | null;
  fatRangeG: { min: number; max: number } | null;
  fiberRecommendedG: { min: number; recommended: number } | null;
  hydrationPlan: {
    baselineMl: { min: number; max: number };
    exerciseAdjustmentMl: number;
    totalRecommendedMl: { min: number; max: number };
    methodology: string;
    limitations: string;
  } | null;
  limitations: string[];
}

export function calculateNutritionalBlueprint(params: {
  weightKg?: number | null;
  heightCm?: number | null;
  age?: number | null;
  gender?: "male" | "female" | null;
  bodyFatPercent?: number | null;
  activityLevel?: "SEDENTARY" | "MODERATE" | "HIGH" | "ATHLETE" | null;
  primaryGoal?: "STRENGTH" | "HYPERTROPHY" | "ENDURANCE" | "RECOMPOSITION" | "HEALTH_LONGEVITY" | null;
  workoutDurationMinutesToday?: number;
  ambientTempC?: number;
}): NutritionalTargetsResult {
  const {
    weightKg,
    heightCm,
    age,
    gender,
    bodyFatPercent,
    activityLevel = "MODERATE",
    primaryGoal = "HYPERTROPHY",
    workoutDurationMinutesToday = 0,
    ambientTempC = 24,
  } = params;

  // Rule: If user hasn't provided biological minimums (weight & height & age), do NOT invent them!
  if (!weightKg || !heightCm || !age || !gender) {
    return {
      isConfigured: false,
      bmrKcal: null,
      bmrFormulaUsed: null,
      tdeeEstimatedKcal: null,
      tdeeBreakdown: null,
      calorieTargetRange: null,
      proteinRangeG: null,
      carbsRangeG: null,
      fatRangeG: null,
      fiberRecommendedG: null,
      hydrationPlan: null,
      limitations: [
        "Insumos antropométricos insuficientes (peso, altura, idade ou sexo biológico ausentes).",
        "Aguardando definição do perfil biométrico para calcular estimativas metabólicas.",
      ],
    };
  }

  // 1. BMR Calculation
  let bmrKcal = 0;
  let bmrFormulaUsed: "Mifflin-St Jeor" | "Katch-McArdle" = "Mifflin-St Jeor";

  // Use Katch-McArdle if body fat was measured/provided
  if (bodyFatPercent && bodyFatPercent > 3 && bodyFatPercent < 60) {
    const leanMassKg = weightKg * (1 - bodyFatPercent / 100);
    bmrKcal = Math.round(370 + 21.6 * leanMassKg);
    bmrFormulaUsed = "Katch-McArdle";
  } else {
    // Mifflin-St Jeor (gold standard predictive equation)
    const sexOffset = gender === "male" ? 5 : -161;
    bmrKcal = Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + sexOffset);
    bmrFormulaUsed = "Mifflin-St Jeor";
  }

  // 2. TDEE Components Breakdown
  // Activity multiplier bounds
  let activityFactorMin = 1.35;
  let activityFactorMax = 1.55;

  if (activityLevel === "SEDENTARY") {
    activityFactorMin = 1.15;
    activityFactorMax = 1.25;
  } else if (activityLevel === "MODERATE") {
    activityFactorMin = 1.35;
    activityFactorMax = 1.55;
  } else if (activityLevel === "HIGH") {
    activityFactorMin = 1.6;
    activityFactorMax = 1.8;
  } else if (activityLevel === "ATHLETE") {
    activityFactorMin = 1.85;
    activityFactorMax = 2.1;
  }

  const tdeeMin = Math.round(bmrKcal * activityFactorMin);
  const tdeeMax = Math.round(bmrKcal * activityFactorMax);
  const tdeeAvg = Math.round((tdeeMin + tdeeMax) / 2);

  // Approximate physical components of TDEE
  const tefKcal = Math.round(tdeeAvg * 0.1); // ~10% thermic effect of food
  const neatKcal = Math.round(tdeeAvg * 0.18); // spontaneous activity
  const eatKcal = Math.max(0, tdeeAvg - bmrKcal - tefKcal - neatKcal);

  // 3. Caloric Target Range based on Goal
  let calDeltaMin = 0;
  let calDeltaMax = 0;

  if (primaryGoal === "HYPERTROPHY" || primaryGoal === "STRENGTH") {
    // Lean surplus (+150 to +350 kcal)
    calDeltaMin = 150;
    calDeltaMax = 350;
  } else if (primaryGoal === "RECOMPOSITION") {
    // Slight deficit to eucaloric (-200 to +100 kcal)
    calDeltaMin = -200;
    calDeltaMax = 100;
  } else if (primaryGoal === "ENDURANCE") {
    // Eucaloric with high glycogen replenishment (-50 to +200 kcal)
    calDeltaMin = -50;
    calDeltaMax = 200;
  } else {
    // HEALTH_LONGEVITY / General fitness: Eucaloric (-100 to +100 kcal)
    calDeltaMin = -100;
    calDeltaMax = 100;
  }

  const calorieTargetRange = {
    min: Math.round(tdeeMin + calDeltaMin),
    max: Math.round(tdeeMax + calDeltaMax),
    recommended: Math.round(tdeeAvg + (calDeltaMin + calDeltaMax) / 2),
  };

  // 4. Evidence-based Protein Range (Morton et al. 2018; Helms et al. 2014)
  let proteinGPerKgMin = 1.6;
  let proteinGPerKgMax = 2.2;

  if (primaryGoal === "RECOMPOSITION") {
    // Higher protein in slight deficit to safeguard nitrogen balance
    proteinGPerKgMin = 1.8;
    proteinGPerKgMax = 2.4;
  } else if (primaryGoal === "ENDURANCE") {
    proteinGPerKgMin = 1.4;
    proteinGPerKgMax = 1.8;
  }

  const proteinRangeG = {
    min: Math.round(weightKg * proteinGPerKgMin),
    max: Math.round(weightKg * proteinGPerKgMax),
    gPerKgMin: proteinGPerKgMin,
    gPerKgMax: proteinGPerKgMax,
  };

  // 5. Fat Range (0.6 - 1.2 g/kg or 20-30% of energy)
  const fatMinG = Math.round(weightKg * 0.7);
  const fatMaxG = Math.round(weightKg * 1.1);
  const fatRangeG = { min: fatMinG, max: fatMaxG };

  // 6. Carbs Range (remaining calories allocated to glycogen)
  const avgTargetCal = calorieTargetRange.recommended;
  const proteinAvgKcal = Math.round(((proteinRangeG.min + proteinRangeG.max) / 2) * 4);
  const fatAvgKcal = Math.round(((fatRangeG.min + fatRangeG.max) / 2) * 9);
  const remainingCarbCal = Math.max(400, avgTargetCal - proteinAvgKcal - fatAvgKcal);

  const carbsMinG = Math.max(100, Math.round((remainingCarbCal - 200) / 4));
  const carbsMaxG = Math.round((remainingCarbCal + 200) / 4);
  const carbsRangeG = { min: carbsMinG, max: carbsMaxG };

  // 7. Fiber (14g per 1000 kcal - Institute of Medicine)
  const fiberRecommendedG = {
    min: Math.round((avgTargetCal / 1000) * 12),
    recommended: Math.round((avgTargetCal / 1000) * 14),
  };

  // 8. Hydration (ACSM 2007; EFSA 2010)
  // Baseline: 35-45 ml/kg
  const baseHydrationMinMl = Math.round(weightKg * 35);
  const baseHydrationMaxMl = Math.round(weightKg * 45);

  // Exercise adjustment: ~500 to 800 ml per hour of active training
  let exerciseHydrationMl = 0;
  if (workoutDurationMinutesToday > 0) {
    exerciseHydrationMl = Math.round((workoutDurationMinutesToday / 60) * 650);
  }

  // Thermal adjustment if hot (>28°C)
  if (ambientTempC > 28) {
    exerciseHydrationMl += 350;
  }

  const hydrationPlan = {
    baselineMl: { min: baseHydrationMinMl, max: baseHydrationMaxMl },
    exerciseAdjustmentMl: exerciseHydrationMl,
    totalRecommendedMl: {
      min: baseHydrationMinMl + exerciseHydrationMl,
      max: baseHydrationMaxMl + exerciseHydrationMl,
    },
    methodology: "ACSM / EFSA (35-45 ml/kg base + reposição dinâmica por duração de treino e sudorese)",
    limitations:
      "A taxa de sudorese varia individualmente de 0.5L a 2.0L/h. Acompanhe a coloração da urina pela Escala de Armstrong.",
  };

  return {
    isConfigured: true,
    bmrKcal,
    bmrFormulaUsed,
    tdeeEstimatedKcal: { min: tdeeMin, max: tdeeMax, average: tdeeAvg },
    tdeeBreakdown: {
      basalKcal: bmrKcal,
      neatKcal,
      eatKcal,
      tefKcal,
    },
    calorieTargetRange,
    proteinRangeG,
    carbsRangeG,
    fatRangeG,
    fiberRecommendedG,
    hydrationPlan,
    limitations: [
      "O TDEE é uma estimativa populacional inicial e deve ser ajustado conforme a variação da média semanal de peso na balança.",
      "As necessidades proteicas e calóricas são expressas em faixas fisiológicas para permitir flexibilidade alimentar.",
      "Consulte um nutricionista registrado para planejamento dietético clínico individualizado.",
    ],
  };
}
