// GL AI CONTEXT BUILDER // PIPELINE & MINIMAL CONTEXT FILTER
// Architectural Flow:
// USER QUERY -> INTENT DETECTION -> DATA SELECTION -> SCIENTIFIC ENGINE -> EVIDENCE ENGINE -> STRUCTURED RESULT -> GEMINI (OR DETERMINISTIC FALLBACK)
// Standards: Zero personal data leakage, minimal context, deterministic precomputation, anti-hallucination.

import { calculateNutritionalBlueprint } from "./nutritionEngine";
import { calculateHydrationTarget } from "./hydrationEngine";
import { evaluateRecovery, GLReadinessIndex } from "./recoveryEngine";
import { generateGlobalProgressionReport, GlobalProgressionReport } from "./progressionEngine";
import { computePersonalRecords, OverallPrVault } from "./prEngine";
import { calculateHeartRateProfile } from "./heartRateEngine";
import { getEvidenceEntry } from "./evidenceEngine";

export type AIIntent =
  | "WORKOUT_PROGRESSION"
  | "NUTRITION_HYDRATION"
  | "SLEEP_RECOVERY"
  | "CARDIO_PHYSIOLOGY"
  | "BODY_COMPOSITION"
  | "GENERAL_OVERVIEW";

export interface StructuredAIPayload {
  query: string;
  intent: AIIntent;
  intentDescription: string;
  hasSufficientTelemetry: boolean;
  missingDataNotes: string[];
  precomputedMetrics: Record<string, any>;
  academicEvidence: {
    topic: string;
    level: string;
    primarySource: string;
    consensusRecommendation: string;
    limitations: string;
  }[];
  minimalContext: Record<string, any>;
}

export function detectUserIntent(query: string): AIIntent {
  const q = (query || "").toLowerCase();

  if (
    q.includes("sono") ||
    q.includes("dormir") ||
    q.includes("recupera") ||
    q.includes("hrv") ||
    q.includes("fadiga") ||
    q.includes("descanso") ||
    q.includes("readiness")
  ) {
    return "SLEEP_RECOVERY";
  }

  if (
    q.includes("água") ||
    q.includes("agua") ||
    q.includes("hidrata") ||
    q.includes("dieta") ||
    q.includes("calor") ||
    q.includes("proteí") ||
    q.includes("protei") ||
    q.includes("macro") ||
    q.includes("comida") ||
    q.includes("carboidrato")
  ) {
    return "NUTRITION_HYDRATION";
  }

  if (
    q.includes("cardio") ||
    q.includes("corrida") ||
    q.includes("correr") ||
    q.includes("pace") ||
    q.includes("frequência cardíaca") ||
    q.includes("frequencia cardiaca") ||
    q.includes("bpm") ||
    q.includes("zona 2") ||
    q.includes("bike") ||
    q.includes("ciclismo")
  ) {
    return "CARDIO_PHYSIOLOGY";
  }

  if (
    q.includes("peso") ||
    q.includes("gordura") ||
    q.includes("massa magra") ||
    q.includes("medida") ||
    q.includes("antropometria") ||
    q.includes("braço") ||
    q.includes("cintura")
  ) {
    return "BODY_COMPOSITION";
  }

  if (
    q.includes("treino") ||
    q.includes("carga") ||
    q.includes("progresso") ||
    q.includes("progressão") ||
    q.includes("volume") ||
    q.includes("1rm") ||
    q.includes("pr") ||
    q.includes("repetição") ||
    q.includes("repeticoes") ||
    q.includes("estagna") ||
    q.includes("série")
  ) {
    return "WORKOUT_PROGRESSION";
  }

  return "GENERAL_OVERVIEW";
}

/**
 * buildAIContext
 * Filters out all sensitive data (passwords, tokens, emails, unrelated modules)
 * Pre-computes all scientific values deterministically so the AI does NOT invent numbers.
 */
export function buildAIContext(query: string, rawTelemetry: any): StructuredAIPayload {
  const intent = detectUserIntent(query);
  const missingDataNotes: string[] = [];

  // Extract raw components safely
  const profile = rawTelemetry?.userProfile || {};
  const workouts = Array.isArray(rawTelemetry?.workouts) ? rawTelemetry.workouts : [];
  const sleep = rawTelemetry?.sleep || null;
  const cardio = Array.isArray(rawTelemetry?.cardio) ? rawTelemetry.cardio : [];
  const nutrition = rawTelemetry?.nutrition || null;
  const bodyMetrics = rawTelemetry?.bodyMetrics || null;
  const recentMood = rawTelemetry?.recentMood || null;

  const age = Number(profile.age) || Number(bodyMetrics?.age) || 0;
  const weightKg = Number(profile.weightKg) || Number(bodyMetrics?.weightKg) || 0;
  const heightCm = Number(profile.heightCm) || Number(bodyMetrics?.heightCm) || 0;
  const gender = profile.gender || bodyMetrics?.gender || "male";
  const bodyFatPercent = Number(bodyMetrics?.bodyFatPercent) || 0;

  // Initialize precomputed structures
  let precomputedMetrics: Record<string, any> = {};
  let minimalContext: Record<string, any> = {};
  const academicEvidence: StructuredAIPayload["academicEvidence"] = [];

  // 1. Precompute based on intent
  if (intent === "WORKOUT_PROGRESSION" || intent === "GENERAL_OVERVIEW") {
    const progressionReport: GlobalProgressionReport = generateGlobalProgressionReport(workouts);
    const prVault: OverallPrVault = computePersonalRecords(workouts, cardio);

    precomputedMetrics.progression = {
      hasSufficientData: progressionReport.hasSufficientData,
      totalCompletedWorkouts: progressionReport.totalCompletedWorkouts,
      weeklyFrequency: progressionReport.weeklyFrequency,
      overallTrend: progressionReport.overallTrend,
      exercisesSample: progressionReport.exercisesAnalyzed.slice(0, 5).map((e) => ({
        name: e.exerciseName,
        status: e.statusLabel,
        loadDeltaKg: e.loadDeltaKg,
        volumeDeltaKg: e.volumeDeltaKg,
      })),
    };

    precomputedMetrics.personalRecords = {
      hasRecords: prVault.hasRecords,
      totalStrengthPrs: prVault.totalStrengthPrs,
      allTimeTonnageKg: prVault.allTimeTonnageWorkout?.volumeKg || null,
      topPrs: prVault.strengthPrs.slice(0, 4).map((p) => ({
        exercise: p.exerciseName,
        maxLoadKg: p.maxLoad?.valueKg || null,
        maxLoadDate: p.maxLoad?.date || null,
        estimated1RmKg: p.estimated1RmMax?.valueKg || null,
      })),
    };

    minimalContext.workoutCount = workouts.filter((w: any) => w.status === "completed").length;
    minimalContext.totalAccumulatedVolumeKg = workouts.reduce(
      (sum: number, w: any) => sum + (Number(w.totalVolumeKg) || 0),
      0
    );

    if (workouts.length < 2) {
      missingDataNotes.push(
        "Menos de 2 treinos registrados: não há amostragem suficiente para comprovar adaptação de sobrecarga."
      );
    }

    academicEvidence.push({
      topic: "Sobrecarga Progressiva",
      level: "A (Meta-análise)",
      primarySource: "Schoenfeld et al. (2016) / Helms et al. (2015)",
      consensusRecommendation:
        "Incrementos de volume entre 10-20 séries por grupo muscular/semana em proximidade da falha (RIR 1-3).",
      limitations: "Respostas hipertróficas possuem alta variabilidade interindividual genética.",
    });
  }

  if (intent === "NUTRITION_HYDRATION" || intent === "GENERAL_OVERVIEW") {
    const nutritionBlueprint = calculateNutritionalBlueprint({
      weightKg,
      heightCm,
      age,
      gender,
      bodyFatPercent: bodyFatPercent > 0 ? bodyFatPercent : null,
      activityLevel: profile.activityLevel || "MODERATE",
      primaryGoal: profile.primaryGoal || "HYPERTROPHY",
    });

    const hydrationEstimate = calculateHydrationTarget({
      weightKg,
      ambientTemperatureC: 24,
      exerciseDurationMinutes: workouts.length > 0 ? 60 : 0,
      sweatRateCategory: "MODERATE",
    });

    precomputedMetrics.nutrition = {
      isConfigured: nutritionBlueprint.isConfigured,
      bmrKcal: nutritionBlueprint.bmrKcal,
      bmrFormula: nutritionBlueprint.bmrFormulaUsed,
      calorieRange: nutritionBlueprint.calorieTargetRange,
      proteinRangeG: nutritionBlueprint.proteinRangeG,
      carbsRangeG: nutritionBlueprint.carbsRangeG,
      fatRangeG: nutritionBlueprint.fatRangeG,
    };

    precomputedMetrics.hydration = {
      isConfigured: hydrationEstimate.hasSufficientData,
      initialEstimatedRangeMl: hydrationEstimate.totalEstimatedRangeMl,
      baselineRangeMl: hydrationEstimate.baselineRangeMl,
      disclaimer: hydrationEstimate.disclaimer,
    };

    minimalContext.currentWaterMl = nutrition?.waterCurrentMl || 0;
    minimalContext.currentCaloriesKcal = nutrition?.caloriesCurrent || 0;

    if (!weightKg || !heightCm) {
      missingDataNotes.push("Peso ou altura ausentes no perfil; faixas nutricionais não puderam ser calculadas.");
    }

    academicEvidence.push({
      topic: "Ingestão Proteica e Balanço Nitrogenado",
      level: "A (Revisão Sistemática)",
      primarySource: "Morton et al. (2018) / Helms et al. (2014)",
      consensusRecommendation: "1.6 a 2.2 g/kg/dia para otimização da síntese proteica miofibrilar.",
      limitations: "Valores baseados em peso corporal total; podem requerer ajuste para indivíduos com alto percentual de gordura.",
    });
  }

  if (intent === "SLEEP_RECOVERY" || intent === "GENERAL_OVERVIEW") {
    const recoveryIndex: GLReadinessIndex = evaluateRecovery(sleep, recentMood);

    precomputedMetrics.readiness = {
      hasSufficientData: recoveryIndex.hasSufficientData,
      readinessScore: recoveryIndex.score,
      confidence: recoveryIndex.confidence,
      categoryLabel: recoveryIndex.categoryLabel,
      factorsUsed: recoveryIndex.factorsUsed,
      hrvMeasuredMs: recoveryIndex.hrvAnalysis.measuredMs,
      hrvTrend: recoveryIndex.hrvAnalysis.trend,
      sleepDurationHours: sleep?.durationHours || null,
      awakeMinutes: sleep?.awakeMinutes || null,
      subjectiveState: recoveryIndex.subjectiveCheckin.recorded
        ? {
            energy: recoveryIndex.subjectiveCheckin.energy,
            stress: recoveryIndex.subjectiveCheckin.stress,
            classification: "SELF_REPORTED / REAL",
          }
        : null,
    };

    minimalContext.sleepRegistered = Boolean(sleep && sleep.durationHours > 0);

    if (!sleep || sleep.durationHours === 0) {
      missingDataNotes.push("Nenhum registro de sono no período; impossível emitir análise fisiológica de prontidão.");
    }
    if (!sleep?.hrvMs || sleep.hrvMs === 0) {
      missingDataNotes.push("Telemetria de HRV não informada; análise de modulação autonômica parassimpática indisponível.");
    }

    academicEvidence.push({
      topic: "Recuperação Autonômica & Sono",
      level: "A (Consenso de Medicina do Sono)",
      primarySource: "AASM (2014) / Shaffer & Ginsberg (2017)",
      consensusRecommendation: "7 a 9 horas de sono em adultos para homeostase endócrina e depuração do sistema glinfático.",
      limitations: "Uma medição pontual de HRV rMSSD tem baixa significância sem comparação contra a média móvel pessoal.",
    });
  }

  if (intent === "CARDIO_PHYSIOLOGY" || intent === "GENERAL_OVERVIEW") {
    const hrProfile = calculateHeartRateProfile({
      age,
      hrMaxMeasured: null,
      hrRestMeasured: sleep?.restingHeartRateBpm || null,
    });

    precomputedMetrics.cardio = {
      hasSessions: cardio.length > 0,
      totalSessions: cardio.length,
      hrProfile: hrProfile
        ? {
            hrMaxEstimated: hrProfile.hrMaxEstimated,
            hrMaxProvenance: hrProfile.hrMaxProvenance,
            zones: hrProfile.zones.map((z) => ({
              zone: z.zoneNumber,
              name: z.zoneName,
              rangeBpm: `${z.minBpm}-${z.maxBpm} bpm`,
            })),
          }
        : null,
      recentSessions: cardio.slice(-3).map((c: any) => ({
        sport: c.sport,
        distanceKm: c.distanceKm,
        durationMin: c.durationMinutes,
        avgPace: c.avgPace,
        avgHr: c.avgHeartRate,
      })),
    };

    if (cardio.length === 0) {
      missingDataNotes.push("Nenhuma sessão de cardio registrada no ecossistema.");
    }

    academicEvidence.push({
      topic: "Zonas de Treinamento Cardiovascular",
      level: "B (Diretriz Fisiológica)",
      primarySource: "Tanaka et al. (2001) / Seiler (2010)",
      consensusRecommendation: "Aproximadamente 80% do volume cardiovascular em baixa intensidade (Zona 2) para eficiência oxidativa mitocondrial.",
      limitations: "Zonas baseadas em equações etárias possuem erro padrão de ±8 a 12 bpm sem ergoespirometria laboratorial direta.",
    });
  }

  if (intent === "BODY_COMPOSITION") {
    precomputedMetrics.bodyComposition = {
      weightKg: weightKg || null,
      heightCm: heightCm || null,
      bodyFatPercent: bodyFatPercent > 0 ? bodyFatPercent : null,
      leanMassKg: bodyMetrics?.leanMassKg || null,
      hasEvolutionEntries: (bodyMetrics?.evolution || []).length > 1,
    };

    if (!weightKg) {
      missingDataNotes.push("Peso corporal não cadastrado.");
    }
    if (!bodyFatPercent) {
      missingDataNotes.push("Percentual de gordura não medido por dobras cutâneas ou DEXA.");
    }
  }

  const intentDescriptions: Record<AIIntent, string> = {
    WORKOUT_PROGRESSION: "Avaliação de sobrecarga mecânica, progressão de volume, cargas e personal records.",
    NUTRITION_HYDRATION: "Estimativa inicial de faixas metabólicas, macronutrientes e balanço hídrico.",
    SLEEP_RECOVERY: "Índice derivado de prontidão (GL Readiness Index), arquitetura de sono e modulação autonômica.",
    CARDIO_PHYSIOLOGY: "Desempenho aeróbico, ritmo, distância e zonas de frequência cardíaca.",
    BODY_COMPOSITION: "Antropometria, medidas corporais e composição tecidual.",
    GENERAL_OVERVIEW: "Síntese multivariada da telemetria integrada do ecossistema Gym Labs.",
  };

  return {
    query,
    intent,
    intentDescription: intentDescriptions[intent],
    hasSufficientTelemetry: missingDataNotes.length < 3,
    missingDataNotes,
    precomputedMetrics,
    academicEvidence,
    minimalContext,
  };
}

/**
 * generateDeterministicResponse
 * High-precision scientific engine fallback when Gemini is not available or disabled.
 * Produces structured, evidence-backed answers using precomputed values and zero hallucinations.
 */
export function generateDeterministicResponse(payload: StructuredAIPayload): string {
  const { intent, precomputedMetrics, missingDataNotes, academicEvidence } = payload;
  const sections: string[] = [];

  sections.push(`**GL INTELLIGENCE // NÚCLEO CIENTÍFICO DETERMINÍSTICO**`);
  sections.push(`*Foco da Investigação:* ${payload.intentDescription}`);

  if (missingDataNotes.length > 0) {
    sections.push(`\n**LIMITAÇÕES DE TELEMETRIA DISPONÍVEL:**\n${missingDataNotes.map((n) => `• ${n}`).join("\n")}`);
  }

  if (intent === "WORKOUT_PROGRESSION") {
    const prog = precomputedMetrics.progression;
    const prs = precomputedMetrics.personalRecords;

    if (!prog?.hasSufficientData) {
      sections.push(
        `\n**PROGRESSÃO DE CARGAS & VOLUME:**\n- **Status:** Dados insuficientes.\n- **Diagnóstico:** É necessário registrar ao menos 2 sessões concluídas do mesmo exercício para identificar sobrecarga progressiva, estagnação ou fadiga acumulada.`
      );
    } else {
      sections.push(
        `\n**ANÁLISE DE PROGRESSÃO DE FORÇA:**\n- **Sessões Concluídas:** ${prog.totalCompletedWorkouts} treinos\n- **Frequência Média:** ${prog.weeklyFrequency} sessões/semana\n- **Tendência Geral:** ${prog.overallTrend}\n- **Amostra de Exercícios:**\n${(prog.exercisesSample || [])
          .map((e: any) => `  • ${e.name}: ${e.status} (Carga: ${e.loadDeltaKg >= 0 ? "+" : ""}${e.loadDeltaKg} kg)`)
          .join("\n")}`
      );
    }

    if (prs?.hasRecords) {
      sections.push(
        `\n**RECORDES PESSOAIS (PRs REAIS DETECTADOS):**\n${(prs.topPrs || [])
          .filter((p: any) => p.maxLoadKg)
          .map((p: any) => `• ${p.exercise}: Carga Máxima ${p.maxLoadKg} kg | 1RM Estimado: ${p.estimated1RmKg || "--"} kg (Epley)`)
          .join("\n")}`
      );
    }
  } else if (intent === "NUTRITION_HYDRATION") {
    const nut = precomputedMetrics.nutrition;
    const hyd = precomputedMetrics.hydration;

    if (nut?.isConfigured) {
      sections.push(
        `\n**FAIXAS NUTRICIONAIS ESTIMADAS (SCIENTIFIC ENGINE):**\n- **Taxa Metabólica Basal (BMR):** ~${nut.bmrKcal} kcal (${nut.bmrFormula})\n- **Faixa Calórica Inicial:** ${nut.calorieRange.min} a ${nut.calorieRange.max} kcal/dia\n- **Proteínas (Meta-análise Morton 2018):** ${nut.proteinRangeG.min} a ${nut.proteinRangeG.max} g/dia (${nut.proteinRangeG.gPerKgMin} a ${nut.proteinRangeG.gPerKgMax} g/kg)\n- **Carboidratos:** ${nut.carbsRangeG.min} a ${nut.carbsRangeG.max} g/dia\n- **Gorduras:** ${nut.fatRangeG.min} a ${nut.fatRangeG.max} g/dia`
      );
    }

    if (hyd?.isConfigured) {
      sections.push(
        `\n**HIDRATAÇÃO — FAIXA INICIAL ESTIMADA:**\n- **Faixa Total Recomendada:** ${hyd.initialEstimatedRangeMl.min.toLocaleString()} a ${hyd.initialEstimatedRangeMl.max.toLocaleString()} ml/dia\n- **Base de Repouso:** ${hyd.baselineRangeMl.min.toLocaleString()} - ${hyd.baselineRangeMl.max.toLocaleString()} ml/dia (30-35 ml/kg)\n- *Nota de Integridade:* ${hyd.disclaimer}`
      );
    }
  } else if (intent === "SLEEP_RECOVERY") {
    const rec = precomputedMetrics.readiness;

    if (!rec?.hasSufficientData) {
      sections.push(
        `\n**GL READINESS INDEX // SONO & RECUPERAÇÃO:**\n- **Status:** Sem registros de sono ativos.\n- **Diretriz:** Registre sua primeira noite de sono informando horário de deitar e despertar para que o índice calcule a prontidão e a arquitetura de fases.`
      );
    } else {
      sections.push(
        `\n**GL READINESS INDEX (ÍNDICE DERIVADO):**\n- **Score Calculado:** ${rec.readinessScore}/100 [${rec.categoryLabel}]\n- **Nível de Confiança:** ${rec.confidence}\n- **Fatores Considerados:** ${rec.factorsUsed.join(", ")}\n- **Duração do Sono:** ${rec.sleepDurationHours}h (Vigília pós-início: ${rec.awakeMinutes || 0} min)\n- **HRV (rMSSD):** ${rec.hrvMeasuredMs ? `${rec.hrvMeasuredMs} ms (${rec.hrvTrend})` : "Não mensurado"}\n- *Nota Fisiológica:* Índice derivado dos dados disponíveis. Não representa diagnóstico clínico.`
      );
    }
  } else if (intent === "CARDIO_PHYSIOLOGY") {
    const car = precomputedMetrics.cardio;

    if (car?.hrProfile) {
      sections.push(
        `\n**PERFIL DE FREQUÊNCIA CARDÍACA & ZONAS:**\n- **FC Máxima Estimada:** ${car.hrProfile.hrMaxEstimated} bpm [${car.hrProfile.hrMaxProvenance}]\n- **Zonas de Esforço:**\n${car.hrProfile.zones.map((z: any) => `  • Zona ${z.zone} (${z.name}): ${z.rangeBpm}`).join("\n")}`
      );
    }

    if (car?.hasSessions) {
      sections.push(
        `\n**ÚLTIMAS SESSÕES DE CARDIO REGISTRADAS:**\n${car.recentSessions
          .map((c: any) => `• ${c.sport}: ${c.distanceKm} km em ${c.durationMin} min (Pace médio: ${c.avgPace})`)
          .join("\n")}`
      );
    }
  } else {
    sections.push(
      `\n**SÍNTESE DO ECOSSISTEMA TELEMÉTRICO:**\nUtilize comandos diretos como 'Qual meu volume de treino?', 'Como está minha hidratação?' ou 'Analise minha recuperação' para relatórios direcionados.`
    );
  }

  if (academicEvidence.length > 0) {
    sections.push(
      `\n**FUNDAMENTAÇÃO CIENTÍFICA (EVIDENCE ENGINE):**\n${academicEvidence
        .map(
          (e) =>
            `• **${e.topic}** (${e.level}): *${e.primarySource}* — ${e.consensusRecommendation}`
        )
        .join("\n")}`
    );
  }

  return sections.join("\n");
}
