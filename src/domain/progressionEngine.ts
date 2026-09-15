// GL PROGRESSION ENGINE // LABCORE WORKLOAD & OVERLOAD ANALYTICS
// Detects real overload adaptation, stagnation, and regression across workout history.
// Standards: Schoenfeld et al. (2016) Progressive Overload; Helms et al. (2015).
// Principle: Never declare "progress" without sufficient objective historical data (minimum 2 comparable sessions).

import { WorkoutSession } from "../types";

export interface ExerciseProgressionAnalysis {
  exerciseName: string;
  hasSufficientData: boolean;
  sessionsAnalyzed: number;
  status: "PROGRESSION" | "STAGNATION" | "REGRESSION" | "DELOAD" | "INSUFFICIENT_DATA";
  statusLabel: string;
  loadDeltaKg: number;
  repsDelta: number;
  volumeDeltaKg: number;
  percentVolumeChange: number;
  isStagnant: boolean;
  consecutiveStagnantSessions: number;
  observations: string[];
  recommendation: string;
  historyTimeline: {
    date: string;
    topLoadKg: number;
    topReps: number;
    avgRpe: number;
    totalVolumeKg: number;
  }[];
}

export interface GlobalProgressionReport {
  hasSufficientData: boolean;
  totalCompletedWorkouts: number;
  weeklyFrequency: number; // sessions per 7 days
  frequencyConsistency: "OPTIMAL" | "MODERATE" | "LOW" | "INSUFFICIENT_DATA";
  exercisesAnalyzed: ExerciseProgressionAnalysis[];
  overallTrend: "PROGRESSIVE_OVERLOAD" | "MAINTENANCE" | "FATIGUE_REGRESSION" | "INSUFFICIENT_DATA";
  summary: string;
  scientificNotes: string[];
}

export function analyzeExerciseProgression(
  exerciseName: string,
  workouts: WorkoutSession[]
): ExerciseProgressionAnalysis {
  // 1. Filter only completed workouts that contained this exercise
  const exerciseEntries: {
    date: string;
    topLoadKg: number;
    topReps: number;
    avgRpe: number;
    totalVolumeKg: number;
  }[] = [];

  // Sort chronological
  const sortedWorkouts = [...workouts]
    .filter((w) => w.status === "completed")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  for (const w of sortedWorkouts) {
    const ex = w.exercises.find(
      (e) => e.name.toLowerCase().trim() === exerciseName.toLowerCase().trim()
    );
    if (ex && ex.sets && ex.sets.length > 0) {
      const completedSets = ex.sets.filter((s) => s.completed);
      if (completedSets.length > 0) {
        let maxLoad = 0;
        let repsAtMaxLoad = 0;
        let setVolSum = 0;
        let rpeSum = 0;

        for (const s of completedSets) {
          const load = s.weightKg || 0;
          const reps = s.reps || 0;
          const vol = load * reps;
          setVolSum += vol;
          rpeSum += s.rpe || 8;

          if (load > maxLoad) {
            maxLoad = load;
            repsAtMaxLoad = reps;
          } else if (load === maxLoad && reps > repsAtMaxLoad) {
            repsAtMaxLoad = reps;
          }
        }

        exerciseEntries.push({
          date: w.date,
          topLoadKg: maxLoad,
          topReps: repsAtMaxLoad,
          avgRpe: completedSets.length > 0 ? Math.round((rpeSum / completedSets.length) * 10) / 10 : 0,
          totalVolumeKg: setVolSum,
        });
      }
    }
  }

  // If fewer than 2 sessions, we do NOT have sufficient data to determine progression
  if (exerciseEntries.length < 2) {
    return {
      exerciseName,
      hasSufficientData: false,
      sessionsAnalyzed: exerciseEntries.length,
      status: "INSUFFICIENT_DATA",
      statusLabel: "DADOS INSUFICIENTES",
      loadDeltaKg: 0,
      repsDelta: 0,
      volumeDeltaKg: 0,
      percentVolumeChange: 0,
      isStagnant: false,
      consecutiveStagnantSessions: 0,
      observations: [
        exerciseEntries.length === 0
          ? "Nenhuma sessão registrada para este exercício."
          : "Apenas 1 sessão registrada. São necessárias ao menos 2 sessões concluídas para mensurar sobrecarga progressiva.",
      ],
      recommendation: "Execute e conclua ao menos mais um treino contendo este movimento para calcular a taxa de adaptação.",
      historyTimeline: exerciseEntries,
    };
  }

  // Compare previous session with latest session
  const prev = exerciseEntries[exerciseEntries.length - 2];
  const latest = exerciseEntries[exerciseEntries.length - 1];

  const loadDelta = latest.topLoadKg - prev.topLoadKg;
  const repsDelta = latest.topReps - prev.topReps;
  const volumeDelta = latest.totalVolumeKg - prev.totalVolumeKg;
  const percentVolumeChange =
    prev.totalVolumeKg > 0
      ? Math.round(((latest.totalVolumeKg - prev.totalVolumeKg) / prev.totalVolumeKg) * 100)
      : 0;

  // Stagnation check: Check last 3 sessions for zero load change and zero reps change at high RPE
  let consecutiveStagnant = 0;
  if (exerciseEntries.length >= 3) {
    const last3 = exerciseEntries.slice(-3);
    const load0 = last3[0].topLoadKg;
    const reps0 = last3[0].topReps;
    if (
      last3[1].topLoadKg === load0 &&
      last3[1].topReps === reps0 &&
      last3[2].topLoadKg === load0 &&
      last3[2].topReps === reps0
    ) {
      consecutiveStagnant = 3;
    }
  }

  const isStagnant = consecutiveStagnant >= 3;
  const observations: string[] = [];

  let status: ExerciseProgressionAnalysis["status"] = "PROGRESSION";
  let statusLabel = "PROGRESSÃO DE SOBRECARGA";
  let recommendation = "";

  if (loadDelta > 0) {
    status = "PROGRESSION";
    statusLabel = "AUMENTO DE CARGA";
    observations.push(`Aumento de +${loadDelta} kg na carga máxima (de ${prev.topLoadKg} kg para ${latest.topLoadKg} kg).`);
    recommendation = "Mantenha a nova carga consolidando a mesma faixa de repetições com RIR 1-2.";
  } else if (loadDelta === 0 && repsDelta > 0) {
    status = "PROGRESSION";
    statusLabel = "AUMENTO DE REPETIÇÕES";
    observations.push(`Mesma carga (${latest.topLoadKg} kg) com +${repsDelta} repetição(ões) completadas.`);
    recommendation = "Ao atingir o topo da sua faixa alvo de repetições com boa cadência, progrida a carga.";
  } else if (volumeDelta > 0 && loadDelta >= 0) {
    status = "PROGRESSION";
    statusLabel = "AUMENTO DE TONELAGEM";
    observations.push(`Volume total do exercício cresceu +${volumeDelta} kg (+${percentVolumeChange}%).`);
    recommendation = "Aumento de capacidade de trabalho assimilado com sucesso.";
  } else if (isStagnant) {
    status = "STAGNATION";
    statusLabel = "ESTAGNAÇÃO DETECTADA";
    observations.push("Mesma carga e repetições nas últimas 3 sessões consecutivas.");
    recommendation = "Considere alterar a faixa de repetições (ex: 6-8 para 10-12), adicionar 1 série técnica ou programar uma semana de deload.";
  } else if (loadDelta < 0 || repsDelta < -2) {
    status = "REGRESSION";
    statusLabel = "QUEDA DE DESEMPENHO";
    observations.push(`Redução de desempenho na última sessão (Carga: ${loadDelta} kg, Reps: ${repsDelta}).`);
    recommendation = "Verifique fadiga acumulada, qualidade do sono na noite anterior e ingestão de carboidratos peri-treino.";
  } else {
    status = "PROGRESSION";
    statusLabel = "MANUTENÇÃO ESTÁVEL";
    observations.push("Carga e repetições estáveis em relação à sessão anterior.");
    recommendation = "Tente adicionar 1 repetição na primeira série na próxima sessão.";
  }

  return {
    exerciseName,
    hasSufficientData: true,
    sessionsAnalyzed: exerciseEntries.length,
    status,
    statusLabel,
    loadDeltaKg: loadDelta,
    repsDelta,
    volumeDeltaKg: volumeDelta,
    percentVolumeChange,
    isStagnant,
    consecutiveStagnantSessions: consecutiveStagnant,
    observations,
    recommendation,
    historyTimeline: exerciseEntries,
  };
}

export function generateGlobalProgressionReport(
  workouts: WorkoutSession[]
): GlobalProgressionReport {
  const completedWorkouts = workouts.filter((w) => w.status === "completed");

  if (completedWorkouts.length < 2) {
    return {
      hasSufficientData: false,
      totalCompletedWorkouts: completedWorkouts.length,
      weeklyFrequency: 0,
      frequencyConsistency: "INSUFFICIENT_DATA",
      exercisesAnalyzed: [],
      overallTrend: "INSUFFICIENT_DATA",
      summary: "Histórico insuficiente para emitir análise de progressão global. Conclua ao menos 2 treinos.",
      scientificNotes: [
        "A mensuração do princípio da sobrecarga progressiva exige amostragem temporal para distinguir adaptação mecânica de flutuação diária.",
      ],
    };
  }

  // Compute weekly frequency (sessions per 7 days over workout span)
  const timestamps = completedWorkouts.map((w) => new Date(w.date).getTime());
  const minTime = Math.min(...timestamps);
  const maxTime = Math.max(...timestamps);
  const spanDays = Math.max(7, Math.round((maxTime - minTime) / (1000 * 60 * 60 * 24)));
  const weeklyFreq = Math.round((completedWorkouts.length / (spanDays / 7)) * 10) / 10;

  // Find unique exercises
  const exerciseNames = new Set<string>();
  for (const w of completedWorkouts) {
    for (const ex of w.exercises) {
      if (ex.name) exerciseNames.add(ex.name);
    }
  }

  const analyzed = Array.from(exerciseNames)
    .map((name) => analyzeExerciseProgression(name, completedWorkouts))
    .filter((a) => a.hasSufficientData);

  const progressingCount = analyzed.filter((a) => a.status === "PROGRESSION").length;
  const stagnantCount = analyzed.filter((a) => a.status === "STAGNATION").length;
  const regressingCount = analyzed.filter((a) => a.status === "REGRESSION").length;

  let overallTrend: GlobalProgressionReport["overallTrend"] = "PROGRESSIVE_OVERLOAD";
  if (progressingCount >= stagnantCount && progressingCount >= regressingCount) {
    overallTrend = "PROGRESSIVE_OVERLOAD";
  } else if (stagnantCount > progressingCount) {
    overallTrend = "MAINTENANCE";
  } else {
    overallTrend = "FATIGUE_REGRESSION";
  }

  return {
    hasSufficientData: true,
    totalCompletedWorkouts: completedWorkouts.length,
    weeklyFrequency: weeklyFreq,
    frequencyConsistency: weeklyFreq >= 3 ? "OPTIMAL" : weeklyFreq >= 2 ? "MODERATE" : "LOW",
    exercisesAnalyzed: analyzed,
    overallTrend,
    summary: `${progressingCount} exercícios em progressão ativa, ${stagnantCount} em estagnação e ${regressingCount} com oscilação negativa. Frequência média: ${weeklyFreq} treinos/semana.`,
    scientificNotes: [
      "Sobrecarga progressiva não significa aumentar carga todo treino: repetições, densidade e melhora da amplitude representam progressão de estímulo hipertrófico.",
      "Deload programado a cada 6-10 semanas é essencial para dissipação de fadiga sistêmica e ressensibilização de vias anabólicas.",
    ],
  };
}
