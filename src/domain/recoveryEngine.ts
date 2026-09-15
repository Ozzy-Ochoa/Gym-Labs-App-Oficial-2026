// GL RECOVERY ENGINE // LABCORE AUTONOMIC & SLEEP HOMEOSTASIS
// Scientific evaluation of autonomic recovery, sleep stages, and readiness.
// Standards: Shaffer & Ginsberg (2017) HRV; AASM (2014) Sleep Staging.
// Principle: Readiness is an EXPERIMENTAL DERIVED INDEX, not a clinical neurological diagnosis.
// Never use slogans like "SNC RESTAURADO", "PRONTO PARA CARGA" or "RISCO DE LESÃO".

import { SleepMetrics, MoodLog } from "../types";

export interface SleepComponentScore {
  component: string;
  score: number; // 0 to 100
  weight: number; // 0 to 1
  valueDescription: string;
  targetDescription: string;
}

export interface GLReadinessIndex {
  hasSufficientData: boolean;
  score: number | null; // 0 - 100 or null if empty
  readinessScore: number | null; // Alias for backward compatibility
  confidence: "HIGH" | "MODERATE" | "LOW" | "INSUFFICIENT_DATA";
  title: string; // "GL Readiness Index"
  categoryLabel: string;
  derivedDisclaimer: string;
  factorsUsed: string[];
  sleepScoreBreakdown: {
    totalSleepScore: number | null;
    components: SleepComponentScore[];
    methodology: string;
  };
  hrvAnalysis: {
    measuredMs: number | null;
    historicalAverageMs: number | null;
    trend: "BASELINE" | "ELEVATED" | "SUPPRESSED" | "INSUFFICIENT_DATA";
    clinicalCaution: string;
  };
  subjectiveCheckin: {
    recorded: boolean;
    classification: "SELF_REPORTED / REAL";
    energy: number | null;
    stress: number | null;
    mood: string | null;
    notes: string | null;
    disclaimer: string;
  };
  scientificLimitations: string[];
}

export function evaluateRecovery(
  sleep?: SleepMetrics | null,
  recentMood?: MoodLog | null,
  historicalSleepEntries: SleepMetrics[] = []
): GLReadinessIndex {
  // Check if sleep record has actual data
  const hasSleep = Boolean(sleep && sleep.durationHours > 0);

  if (!hasSleep) {
    return {
      hasSufficientData: false,
      score: null,
      readinessScore: null,
      confidence: "INSUFFICIENT_DATA",
      title: "GL Readiness Index",
      categoryLabel: "AGUARDANDO DADOS",
      derivedDisclaimer: "Índice derivado dos dados disponíveis. Aguardando primeiro registro de sono.",
      factorsUsed: [],
      sleepScoreBreakdown: {
        totalSleepScore: null,
        components: [],
        methodology: "Aguardando telemetria de sono",
      },
      hrvAnalysis: {
        measuredMs: null,
        historicalAverageMs: null,
        trend: "INSUFFICIENT_DATA",
        clinicalCaution: "Nenhuma medição de HRV registrada. Valores não são gerados aleatoriamente.",
      },
      subjectiveCheckin: {
        recorded: Boolean(recentMood && recentMood.energyLevel),
        classification: "SELF_REPORTED / REAL",
        energy: recentMood?.energyLevel || null,
        stress: recentMood?.stressLevel || null,
        mood: recentMood?.mood || null,
        notes: recentMood?.notes || null,
        disclaimer: "Dados subjetivos autorreferidos. Não constituem diagnóstico clínico.",
      },
      scientificLimitations: [
        "Aguardando registros biométricos reais para cálculo do índice.",
        "Não são utilizados valores padrão fictícios.",
      ],
    };
  }

  const sleepData = sleep!;
  const factorsUsed: string[] = [];

  // 1. Transparent Sleep Score Breakdown
  // Component A: Duration (40% weight, 7-9h standard adult range)
  let durationScore = 0;
  if (sleepData.durationHours >= 7 && sleepData.durationHours <= 9) {
    durationScore = 100;
  } else if (sleepData.durationHours >= 6 && sleepData.durationHours < 7) {
    durationScore = 75;
  } else if (sleepData.durationHours > 9 && sleepData.durationHours <= 10) {
    durationScore = 85;
  } else if (sleepData.durationHours >= 5 && sleepData.durationHours < 6) {
    durationScore = 50;
  } else {
    durationScore = 25;
  }
  factorsUsed.push("Duração do sono");

  // Component B: Consistency (20% weight)
  const consistencyScore = sleepData.consistencyPercent > 0 ? sleepData.consistencyPercent : 70;
  if (sleepData.consistencyPercent > 0) factorsUsed.push("Consistência circadiana");

  // Component C: Awakenings / Sleep Efficiency (20% weight)
  let awakeningsScore = 80;
  if (sleepData.awakeMinutes <= 15) awakeningsScore = 100;
  else if (sleepData.awakeMinutes <= 30) awakeningsScore = 80;
  else if (sleepData.awakeMinutes <= 60) awakeningsScore = 60;
  else awakeningsScore = 40;
  factorsUsed.push("Eficiência e despertares noturnos");

  // Component D: Sleep Architecture (Deep + REM if available, 20% weight)
  let architectureScore = 75;
  const hasStages = sleepData.deepSleepPercent > 0 || sleepData.remSleepPercent > 0;
  if (hasStages) {
    const deepScore = Math.min(100, (sleepData.deepSleepPercent / 20) * 100);
    const remScore = Math.min(100, (sleepData.remSleepPercent / 22) * 100);
    architectureScore = Math.round((deepScore + remScore) / 2);
    factorsUsed.push("Proporção de sono profundo (N3) e REM");
  }

  const sleepComponents: SleepComponentScore[] = [
    {
      component: "Duração Total",
      score: durationScore,
      weight: 0.4,
      valueDescription: `${sleepData.durationHours}h`,
      targetDescription: "7.0h a 9.0h (Consenso AASM)",
    },
    {
      component: "Regularidade Circadiana",
      score: consistencyScore,
      weight: 0.2,
      valueDescription: `${consistencyScore}%`,
      targetDescription: "Horários estáveis de dormir e acordar (±30 min)",
    },
    {
      component: "Eficiência de Despertares",
      score: awakeningsScore,
      weight: 0.2,
      valueDescription: `${sleepData.awakeMinutes} min acordado`,
      targetDescription: "< 20 min de vigília intra-sono",
    },
    {
      component: "Estágios Reparadores",
      score: architectureScore,
      weight: 0.2,
      valueDescription: hasStages
        ? `Profundo: ${sleepData.deepSleepPercent}% | REM: ${sleepData.remSleepPercent}%`
        : "Estágios não monitorados",
      targetDescription: "Profundo ≥ 15% | REM ≥ 20%",
    },
  ];

  const totalSleepScore = Math.round(
    sleepComponents.reduce((sum, c) => sum + c.score * c.weight, 0)
  );

  // 2. HRV Analysis (Differentiating Measured vs Historical Baseline)
  let hrvTrend: "BASELINE" | "ELEVATED" | "SUPPRESSED" | "INSUFFICIENT_DATA" =
    "INSUFFICIENT_DATA";
  let hrvAvg: number | null = null;
  const measuredHrv = sleepData.hrvMs > 0 ? sleepData.hrvMs : null;

  if (historicalSleepEntries.length >= 3) {
    const validHrvs = historicalSleepEntries
      .map((s) => s.hrvMs)
      .filter((v) => v && v > 0);
    if (validHrvs.length >= 3) {
      hrvAvg = Math.round(validHrvs.reduce((a, b) => a + b, 0) / validHrvs.length);
      if (measuredHrv !== null) {
        if (measuredHrv < hrvAvg * 0.85) hrvTrend = "SUPPRESSED";
        else if (measuredHrv > hrvAvg * 1.15) hrvTrend = "ELEVATED";
        else hrvTrend = "BASELINE";
      }
    }
  }

  if (measuredHrv !== null) {
    factorsUsed.push("Variabilidade da Frequência Cardíaca (HRV rMSSD)");
  }

  // 3. Subjective Check-in
  const hasSubjective = Boolean(recentMood && recentMood.energyLevel && recentMood.energyLevel > 0);
  let subjectiveScore: number | null = null;
  if (hasSubjective) {
    const energy = (recentMood!.energyLevel / 10) * 100;
    const stress = Math.max(0, 100 - (recentMood!.stressLevel || 5) * 10);
    subjectiveScore = Math.round(energy * 0.6 + stress * 0.4);
    factorsUsed.push("Percepção subjetiva de estresse e energia");
  }

  // 4. Determine Confidence Level
  let confidence: GLReadinessIndex["confidence"] = "LOW";
  const historyCount = historicalSleepEntries.length;
  if (historyCount >= 7 && measuredHrv !== null && hasSubjective) {
    confidence = "HIGH";
  } else if (historyCount >= 3 || measuredHrv !== null) {
    confidence = "MODERATE";
  } else {
    confidence = "LOW";
  }

  // 5. Composite GL Readiness Index Score
  let compositeScore = totalSleepScore;
  if (measuredHrv !== null && subjectiveScore !== null) {
    const hrvScore = Math.min(100, Math.max(20, Math.round((measuredHrv / 75) * 80)));
    compositeScore = Math.round(
      totalSleepScore * 0.5 + hrvScore * 0.3 + subjectiveScore * 0.2
    );
  } else if (measuredHrv !== null) {
    const hrvScore = Math.min(100, Math.max(20, Math.round((measuredHrv / 75) * 80)));
    compositeScore = Math.round(totalSleepScore * 0.65 + hrvScore * 0.35);
  } else if (subjectiveScore !== null) {
    compositeScore = Math.round(totalSleepScore * 0.75 + subjectiveScore * 0.25);
  }

  compositeScore = Math.min(100, Math.max(15, compositeScore));

  // Category labels (Objective, prudential, non-alarmist, no slogans)
  let categoryLabel = "RECUPERAÇÃO FISIOLÓGICA ADEQUADA";
  if (compositeScore >= 85) {
    categoryLabel = "ALTA PRONTIDÃO ESTIMADA";
  } else if (compositeScore >= 70) {
    categoryLabel = "PRONTIDÃO FISIOLÓGICA ESTÁVEL";
  } else if (compositeScore >= 50) {
    categoryLabel = "RECUPERAÇÃO PARCIAL // FADIGA RESIDUAL";
  } else {
    categoryLabel = "PRONTIDÃO REDUZIDA // FADIGA ACUMULADA";
  }

  return {
    hasSufficientData: true,
    score: compositeScore,
    readinessScore: compositeScore,
    confidence,
    title: "GL Readiness Index",
    categoryLabel,
    derivedDisclaimer:
      "Índice derivado dos dados disponíveis. Não representa diagnóstico clínico ou garantia de rendimento.",
    factorsUsed,
    sleepScoreBreakdown: {
      totalSleepScore,
      components: sleepComponents,
      methodology: "AASM 2014 & Sleep Medicine Consensus",
    },
    hrvAnalysis: {
      measuredMs: measuredHrv,
      historicalAverageMs: hrvAvg,
      trend: hrvTrend,
      clinicalCaution:
        "Uma medição isolada de HRV não constitui diagnóstico autonômico; a interpretação requer comparação contra a média móvel individual dos últimos 7 a 28 dias.",
    },
    subjectiveCheckin: {
      recorded: hasSubjective,
      classification: "SELF_REPORTED / REAL",
      energy: recentMood?.energyLevel || null,
      stress: recentMood?.stressLevel || null,
      mood: recentMood?.mood || null,
      notes: recentMood?.notes || null,
      disclaimer:
        "Registro subjetivo autorreferido de percepção psicofisiológica. Não transforma emoção em patologia.",
    },
    scientificLimitations: [
      "A prontidão diária varia com a nutrição, hidratação, estresse psicossocial e fase de sobrecarga de treino.",
      "A sensação ao iniciar o aquecimento motor do treino prevalece sobre índices biométricos para a seleção de carga.",
    ],
  };
}
