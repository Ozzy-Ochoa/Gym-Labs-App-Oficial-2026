// GL TRAINING LOAD ENGINE // LABCORE WORKLOAD & VOLUME ANALYSIS
// Scientific engine for internal (sRPE) and external (tonnage) workload, volume distribution, and ACWR.
// Methodological reference: Foster et al. (2001) sRPE; Gabbett (2016) / Windt (2019) Uncoupled ACWR.

import { WorkoutSession } from "../types";

export interface SessionLoadResult {
  sessionId: string;
  date: string;
  durationMinutes: number;
  avgRpe: number;
  internalLoadAU: number; // Duration (min) × RPE (Foster 2001)
  externalTonnageKg: number; // Sum of sets × reps × weight
  totalSets: number;
  totalFailureSets: number;
  methodology: "Foster sRPE (Duration × Session RPE)";
}

export interface DayWorkloadSummary {
  date: string;
  internalLoadAU: number;
  externalTonnageKg: number;
  sessionsCount: number;
}

export interface ACWRAnalysisResult {
  isSufficientData: boolean;
  minDaysRequired: number;
  availableDaysHistory: number;
  acuteWindowDays: number; // 7 days
  chronicWindowDays: number; // 28 days
  acuteWorkloadAU: number | null;
  chronicWeeklyWorkloadAU: number | null;
  acwrRatio: number | null;
  statusCategory: "INSUFFICIENT_DATA" | "REDUCED_LOAD" | "STABLE_PROGRESSION" | "ABOVE_RECENT_TREND" | "MARKED_SPIKE";
  statusLabel: string;
  clinicalInterpretation: string;
  colorClass: string;
  caveatDisclaimer: string;
}

/**
 * Calculates internal and external load for an individual training session.
 * Internal load follows Foster's session-RPE method (duration in min × RPE).
 */
export function calculateSessionWorkload(workout: WorkoutSession): SessionLoadResult {
  const duration = Math.max(1, workout.durationMinutes || 45);
  const rpe = Math.max(1, Math.min(10, workout.avgRpe || 7));
  const internalLoadAU = Math.round(duration * rpe);

  let externalTonnageKg = 0;
  let totalSets = 0;
  let totalFailureSets = 0;

  if (workout.exercises && workout.exercises.length > 0) {
    for (const ex of workout.exercises) {
      if (ex.sets && ex.sets.length > 0) {
        for (const set of ex.sets) {
          totalSets++;
          if (set.toFailure) totalFailureSets++;
          const weight = Number(set.weightKg) || 0;
          const reps = Number(set.reps) || 0;
          externalTonnageKg += weight * reps;
        }
      }
    }
  }

  // Fallback to workout-level volume if exercise-level details weren't logged
  if (externalTonnageKg === 0 && workout.totalVolumeKg && workout.totalVolumeKg > 0) {
    externalTonnageKg = workout.totalVolumeKg;
  }

  return {
    sessionId: workout.id,
    date: workout.date,
    durationMinutes: duration,
    avgRpe: rpe,
    internalLoadAU,
    externalTonnageKg: Math.round(externalTonnageKg),
    totalSets,
    totalFailureSets,
    methodology: "Foster sRPE (Duration × Session RPE)",
  };
}

/**
 * Evaluates Acute:Chronic Workload Ratio (ACWR) strictly from real workout sessions.
 * If user does not have sufficient history (at least 14 days of logged history spanning the window),
 * this function strictly returns isSufficientData = false and acwrRatio = null.
 * NEVER invents 8400, 7800, or any other fake numbers.
 */
export function calculateACWR(
  workouts: WorkoutSession[],
  referenceDateStr?: string
): ACWRAnalysisResult {
  const disclaimer =
    "O índice ACWR é uma métrica tendencial de monitoramento de volume e não prevê lesões de forma determinística individual. Lesões dependem de fatores multifatoriais biomecânicos e biológicos.";

  if (!workouts || workouts.length === 0) {
    return {
      isSufficientData: false,
      minDaysRequired: 14,
      availableDaysHistory: 0,
      acuteWindowDays: 7,
      chronicWindowDays: 28,
      acuteWorkloadAU: null,
      chronicWeeklyWorkloadAU: null,
      acwrRatio: null,
      statusCategory: "INSUFFICIENT_DATA",
      statusLabel: "DADOS INSUFICIENTES",
      clinicalInterpretation:
        "Você ainda não registrou sessões de treino suficientes para calcular a relação carga aguda:crônica com validade metodológica.",
      colorClass: "text-zinc-400 border-zinc-700 bg-zinc-900/60",
      caveatDisclaimer: disclaimer,
    };
  }

  const refDate = referenceDateStr ? new Date(referenceDateStr) : new Date();
  const refTime = refDate.getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;

  // Filter completed workouts
  const validWorkouts = workouts.filter(
    (w) => w.status === "completed" || (!w.status && w.exercises && w.exercises.length > 0)
  );

  if (validWorkouts.length < 3) {
    return {
      isSufficientData: false,
      minDaysRequired: 14,
      availableDaysHistory: validWorkouts.length,
      acuteWindowDays: 7,
      chronicWindowDays: 28,
      acuteWorkloadAU: null,
      chronicWeeklyWorkloadAU: null,
      acwrRatio: null,
      statusCategory: "INSUFFICIENT_DATA",
      statusLabel: "DADOS INSUFICIENTES",
      clinicalInterpretation:
        "São necessárias pelo menos 3 sessões registradas em um período de 14 a 28 dias para estabelecer uma linha de base de carga crônica.",
      colorClass: "text-zinc-400 border-zinc-700 bg-zinc-900/60",
      caveatDisclaimer: disclaimer,
    };
  }

  // Find oldest and newest workout timestamp to verify window span
  const timestamps = validWorkouts.map((w) => new Date(w.date).getTime()).filter((t) => !isNaN(t));
  if (timestamps.length === 0) {
    return {
      isSufficientData: false,
      minDaysRequired: 14,
      availableDaysHistory: 0,
      acuteWindowDays: 7,
      chronicWindowDays: 28,
      acuteWorkloadAU: null,
      chronicWeeklyWorkloadAU: null,
      acwrRatio: null,
      statusCategory: "INSUFFICIENT_DATA",
      statusLabel: "DADOS INSUFICIENTES",
      clinicalInterpretation: "Datas de treino inválidas ou ausentes.",
      colorClass: "text-zinc-400 border-zinc-700 bg-zinc-900/60",
      caveatDisclaimer: disclaimer,
    };
  }

  const oldestTime = Math.min(...timestamps);
  const historySpanDays = Math.max(1, Math.round((refTime - oldestTime) / oneDayMs));

  // If span of history is under 14 days, chronic base cannot be realistically computed
  if (historySpanDays < 14) {
    return {
      isSufficientData: false,
      minDaysRequired: 14,
      availableDaysHistory: historySpanDays,
      acuteWindowDays: 7,
      chronicWindowDays: 28,
      acuteWorkloadAU: null,
      chronicWeeklyWorkloadAU: null,
      acwrRatio: null,
      statusCategory: "INSUFFICIENT_DATA",
      statusLabel: "COLETANDO LINHA DE BASE",
      clinicalInterpretation: `Histórico atual de ${historySpanDays} dias. O modelo de carga crônica requer ao menos 14 a 28 dias contínuos para calcular a média móvel.`,
      colorClass: "text-zinc-400 border-zinc-700 bg-zinc-900/60",
      caveatDisclaimer: disclaimer,
    };
  }

  // Calculate Acute workload (last 7 days)
  const acuteCutoff = refTime - 7 * oneDayMs;
  const chronicCutoff = refTime - 28 * oneDayMs;

  let acuteLoadSum = 0;
  let chronicLoadSum = 0;
  let acuteSessionCount = 0;
  let chronicSessionCount = 0;

  for (const w of validWorkouts) {
    const wTime = new Date(w.date).getTime();
    if (isNaN(wTime)) continue;

    const session = calculateSessionWorkload(w);

    if (wTime >= acuteCutoff && wTime <= refTime + oneDayMs) {
      acuteLoadSum += session.internalLoadAU;
      acuteSessionCount++;
    }

    if (wTime >= chronicCutoff && wTime <= refTime + oneDayMs) {
      chronicLoadSum += session.internalLoadAU;
      chronicSessionCount++;
    }
  }

  // Uncoupled chronic calculation: 4 weeks of baseline
  const chronicWeeklyAverage = Math.round(chronicLoadSum / 4);

  if (chronicWeeklyAverage === 0) {
    return {
      isSufficientData: false,
      minDaysRequired: 14,
      availableDaysHistory: historySpanDays,
      acuteWindowDays: 7,
      chronicWindowDays: 28,
      acuteWorkloadAU: acuteLoadSum,
      chronicWeeklyWorkloadAU: 0,
      acwrRatio: null,
      statusCategory: "INSUFFICIENT_DATA",
      statusLabel: "CARGA CRÔNICA NULA",
      clinicalInterpretation: "Nenhum treino registrado nas 4 semanas da janela crônica.",
      colorClass: "text-zinc-400 border-zinc-700 bg-zinc-900/60",
      caveatDisclaimer: disclaimer,
    };
  }

  const rawRatio = acuteLoadSum / chronicWeeklyAverage;
  const acwrRatio = Math.round(rawRatio * 100) / 100;

  // Objective, responsible categorization (Section 9 guidelines)
  if (acwrRatio < 0.8) {
    return {
      isSufficientData: true,
      minDaysRequired: 14,
      availableDaysHistory: historySpanDays,
      acuteWindowDays: 7,
      chronicWindowDays: 28,
      acuteWorkloadAU: acuteLoadSum,
      chronicWeeklyWorkloadAU: chronicWeeklyAverage,
      acwrRatio,
      statusCategory: "REDUCED_LOAD",
      statusLabel: "CARGA REDUZIDA",
      clinicalInterpretation:
        "Volume agudo inferior à média histórica crônica recente. Estímulo de sobrecarga abaixo da capacidade acumulada.",
      colorClass: "text-zinc-400 border-zinc-700 bg-zinc-900/80",
      caveatDisclaimer: disclaimer,
    };
  }

  if (acwrRatio <= 1.3) {
    return {
      isSufficientData: true,
      minDaysRequired: 14,
      availableDaysHistory: historySpanDays,
      acuteWindowDays: 7,
      chronicWindowDays: 28,
      acuteWorkloadAU: acuteLoadSum,
      chronicWeeklyWorkloadAU: chronicWeeklyAverage,
      acwrRatio,
      statusCategory: "STABLE_PROGRESSION",
      statusLabel: "PROGRESSÃO ESTÁVEL",
      clinicalInterpretation:
        "Carga aguda alinhada à capacidade crônica acumulada. Relação equilibrada entre estímulo semanal e adaptação fisiológica.",
      colorClass: "text-white border-zinc-600 bg-zinc-900",
      caveatDisclaimer: disclaimer,
    };
  }

  if (acwrRatio <= 1.5) {
    return {
      isSufficientData: true,
      minDaysRequired: 14,
      availableDaysHistory: historySpanDays,
      acuteWindowDays: 7,
      chronicWindowDays: 28,
      acuteWorkloadAU: acuteLoadSum,
      chronicWeeklyWorkloadAU: chronicWeeklyAverage,
      acwrRatio,
      statusCategory: "ABOVE_RECENT_TREND",
      statusLabel: "CARGA ACIMA DO PADRÃO RECENTE",
      clinicalInterpretation:
        "Aumento rápido de volume em relação às 4 semanas anteriores. Demanda maior atenção à recuperação, sono e hidratação.",
      colorClass: "text-zinc-200 border-zinc-500 bg-zinc-900",
      caveatDisclaimer: disclaimer,
    };
  }

  return {
    isSufficientData: true,
    minDaysRequired: 14,
    availableDaysHistory: historySpanDays,
    acuteWindowDays: 7,
    chronicWindowDays: 28,
    acuteWorkloadAU: acuteLoadSum,
    chronicWeeklyWorkloadAU: chronicWeeklyAverage,
    acwrRatio,
    statusCategory: "MARKED_SPIKE",
    statusLabel: "PICO AGUDO DE SOBRECARGA",
    clinicalInterpretation:
      "Variação relevante em relação ao histórico. O volume recente cresceu significativamente acima da base adaptativa crônica. Este indicador não determina individualmente risco de lesão.",
    colorClass: "text-white border-zinc-400 bg-zinc-800",
    caveatDisclaimer: disclaimer,
  };
}
