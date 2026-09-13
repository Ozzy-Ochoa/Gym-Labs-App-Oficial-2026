import React, { useState } from "react";
import { WorkoutSession } from "../../types";
import {
  TrendingUp,
  Flame,
  Dumbbell,
  Award,
  Calendar,
  Layers,
  Zap,
  BarChart3,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from "lucide-react";

interface TrainingAnalyticsProps {
  workouts: WorkoutSession[];
}

export const TrainingAnalytics: React.FC<TrainingAnalyticsProps> = ({ workouts }) => {
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(
    workouts[0]?.id || null
  );

  // Global aggregate metrics
  const totalSessions = workouts.length;
  const totalVolumeKg = workouts.reduce((sum, w) => sum + (w.totalVolumeKg || 0), 0);
  const avgVolumePerSession = totalSessions > 0 ? Math.round(totalVolumeKg / totalSessions) : 0;
  const totalCaloriesBurned = workouts.reduce((sum, w) => sum + (w.caloriesBurned || Math.round((w.totalVolumeKg || 0) * 0.05 + (w.durationMinutes || 45) * 6)), 0);
  const avgCaloriesPerSession = totalSessions > 0 ? Math.round(totalCaloriesBurned / totalSessions) : 0;

  // Aggregate all completed sets
  let totalSetsCount = 0;
  let totalFailureSetsCount = 0;
  const muscleSetsMap: Record<string, number> = {
    Peitoral: 0,
    Costas: 0,
    Quadríceps: 0,
    Posterior: 0,
    Ombros: 0,
    Bíceps: 0,
    Tríceps: 0,
    Panturrilhas: 0,
    Abdômen: 0,
  };

  // PR tracking map: exerciseName -> { maxWeight, estimated1RM, date }
  const prMap: Record<
    string,
    { maxWeight: number; estimated1RM: number; reps: number; date: string }
  > = {};

  workouts.forEach((w) => {
    w.exercises.forEach((ex) => {
      // Categorize muscle
      const mName = ex.muscleGroup.toLowerCase();
      let matchedCategory = "Outros";
      if (mName.includes("peit")) matchedCategory = "Peitoral";
      else if (mName.includes("cost") || mName.includes("dors")) matchedCategory = "Costas";
      else if (mName.includes("quad")) matchedCategory = "Quadríceps";
      else if (mName.includes("post") || mName.includes("isquio") || mName.includes("glút"))
        matchedCategory = "Posterior";
      else if (mName.includes("ombro") || mName.includes("delto")) matchedCategory = "Ombros";
      else if (mName.includes("bíceps") || mName.includes("biceps")) matchedCategory = "Bíceps";
      else if (mName.includes("tríceps") || mName.includes("triceps")) matchedCategory = "Tríceps";
      else if (mName.includes("pant")) matchedCategory = "Panturrilhas";
      else if (mName.includes("abd") || mName.includes("core")) matchedCategory = "Abdômen";

      ex.sets.forEach((s) => {
        if (s.completed) {
          totalSetsCount++;
          if (s.toFailure) totalFailureSetsCount++;
          if (muscleSetsMap[matchedCategory] !== undefined) {
            muscleSetsMap[matchedCategory]++;
          }

          // 1RM estimation via Epley formula: weight * (1 + reps/30)
          const epley1RM = Math.round(s.weightKg * (1 + s.reps / 30));
          const currentPR = prMap[ex.name];
          if (!currentPR || epley1RM > currentPR.estimated1RM) {
            prMap[ex.name] = {
              maxWeight: s.weightKg,
              estimated1RM: epley1RM,
              reps: s.reps,
              date: w.date,
            };
          }
        }
      });
    });
  });

  const failureRatePercent =
    totalSetsCount > 0 ? Math.round((totalFailureSetsCount / totalSetsCount) * 100) : 0;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Overview Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="border border-zinc-800 bg-black p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
              GASTO CALÓRICO
            </span>
            <Flame className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          <div className="text-xl sm:text-2xl font-hud font-bold text-white tracking-wider">
            {totalCaloriesBurned.toLocaleString()} <span className="text-xs text-zinc-500 font-mono">KCAL</span>
          </div>
          <span className="text-[10px] font-mono text-zinc-500 block">
            Média: ~{avgCaloriesPerSession} kcal/treino
          </span>
        </div>

        <div className="border border-zinc-800 bg-black p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
              VOLUME TOTAL
            </span>
            <Dumbbell className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          <div className="text-xl sm:text-2xl font-hud font-bold text-white tracking-wider">
            {totalVolumeKg.toLocaleString()} <span className="text-xs text-zinc-500 font-mono">KG</span>
          </div>
          <span className="text-[10px] font-mono text-zinc-500 block">
            Média: {avgVolumePerSession.toLocaleString()} kg/sessão
          </span>
        </div>

        <div className="border border-zinc-800 bg-black p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
              SÉRIES TOTAIS
            </span>
            <Layers className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          <div className="text-xl sm:text-2xl font-hud font-bold text-white tracking-wider">
            {totalSetsCount}
          </div>
          <span className="text-[10px] font-mono text-zinc-500 block">
            Em {totalSessions} sessões registradas
          </span>
        </div>

        <div className="border border-zinc-800 bg-black p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
              SÉRIES NA FALHA
            </span>
            <Flame className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          <div className="text-xl sm:text-2xl font-hud font-bold text-zinc-200 tracking-wider">
            {totalFailureSetsCount}
          </div>
          <span className="text-[10px] font-mono text-zinc-500 block">
            Taxa de intensidade: {failureRatePercent}%
          </span>
        </div>

        <div className="border border-zinc-800 bg-black p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
              RECORDES (PRs)
            </span>
            <Award className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          <div className="text-xl sm:text-2xl font-hud font-bold text-white tracking-wider">
            {Object.keys(prMap).length}
          </div>
          <span className="text-[10px] font-mono text-zinc-500 block">
            Exercícios monitorados
          </span>
        </div>
      </div>

      {/* Muscle Group Weekly Volume Distribution */}
      <div className="border border-zinc-800 bg-black p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
          <div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">
              BALANÇO BIOMECÂNICO // HIPERTROFIA
            </span>
            <h3 className="text-base font-hud font-bold text-white tracking-wider">
              DISTRIBUIÇÃO DE SÉRIES POR GRUPO MUSCULAR
            </h3>
          </div>
          <span className="text-[11px] font-mono text-zinc-400">
            Faixa Ótima: 10 a 20 séries/semana
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(muscleSetsMap).map(([muscle, count]) => {
            // Target is 12-16 sets per week
            const percentOfIdeal = Math.min(100, Math.round((count / 16) * 100));
            return (
              <div
                key={muscle}
                className="border border-zinc-800/80 bg-zinc-950 p-3 space-y-2 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-white">{muscle}</span>
                  <span className="text-zinc-400">
                    <strong className="text-white">{count}</strong> séries
                  </span>
                </div>
                <div className="w-full h-2 bg-zinc-900 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      count >= 10 ? "bg-white" : count >= 5 ? "bg-zinc-400" : "bg-zinc-700"
                    }`}
                    style={{ width: `${Math.max(5, percentOfIdeal)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500">
                  <span>{count < 8 ? "Sub-ótimo" : count <= 18 ? "Faixa Ideal" : "Volume Alto"}</span>
                  <span>{percentOfIdeal}% da meta</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Failure Rate & Training Intensity Insights */}
      <div className="border border-zinc-800 bg-black p-4 sm:p-6 space-y-3">
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
          <Flame className="w-4 h-4 text-white" />
          <div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">
              MÉTRICA DE ESFORÇO MECÂNICO
            </span>
            <h3 className="text-base font-hud font-bold text-white tracking-wider">
              TAXA DE FALHA MUSCULAR & PROXIMIDADE DO LIMITE ({failureRatePercent}%)
            </h3>
          </div>
        </div>

        <p className="text-xs font-mono text-zinc-400 leading-relaxed">
          {failureRatePercent > 40
            ? "Você está operando com altíssima intensidade (mais de 40% das séries levadas à falha concêntrica). Isso fornece potente estímulo hipertrófico, mas gera acúmulo acelerado de fadiga neuromuscular. Recomendamos monitorar sono e recuperação."
            : failureRatePercent >= 15
            ? "Proporção balanceada de esforço. Levar de 1 a 2 séries por exercício até a falha com as demais em RIR 1-2 maximiza a tensão mecânica minimizando danos articulares desnecessários."
            : "Taxa de falha baixa (abaixo de 15%). Certifique-se de que suas últimas repetições estejam a 0-2 repetições da falha real para garantir recrutamento total de fibras tipo II."}
        </p>
      </div>

      {/* 1RM & PR Board */}
      <div className="border border-zinc-800 bg-black p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">
              PROGRESSÃO DE CARGA // FÓRMULA DE EPLEY
            </span>
            <h3 className="text-base font-hud font-bold text-white tracking-wider">
              QUADRO DE RECORDES & 1RM ESTIMADA
            </h3>
          </div>
          <Award className="w-4 h-4 text-amber-400" />
        </div>

        {Object.keys(prMap).length === 0 ? (
          <p className="text-xs font-mono text-zinc-500 text-center py-6">
            Nenhuma série registrada ainda para calcular 1RM e recordes pessoais.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(prMap).map(([name, data]) => (
              <div
                key={name}
                className="border border-zinc-800 bg-zinc-950 p-3 space-y-2 hover:border-zinc-700 transition-colors"
              >
                <span className="text-xs font-hud font-bold text-white block truncate">
                  {name}
                </span>
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-[9px] font-mono text-zinc-500 uppercase block">
                      1RM ESTIMADA
                    </span>
                    <span className="text-lg font-hud font-bold text-white">
                      {data.estimated1RM} <span className="text-[10px] text-zinc-500">KG</span>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase block">
                      MELHOR CARGA
                    </span>
                    <span className="text-xs font-mono text-zinc-300">
                      {data.maxWeight}kg × {data.reps}r
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detailed Session History */}
      <div className="border border-zinc-800 bg-black p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">
              LOGS DE TREINAMENTO REALIZADOS
            </span>
            <h3 className="text-base font-hud font-bold text-white tracking-wider">
              HISTÓRICO COMPLETO DE SESSÕES ({workouts.length})
            </h3>
          </div>
          <Calendar className="w-4 h-4 text-zinc-400" />
        </div>

        {workouts.length === 0 ? (
          <p className="text-xs font-mono text-zinc-500 text-center py-8">
            Nenhum treino realizado ainda. Inicie um treino na aba Rotinas para registrar suas séries.
          </p>
        ) : (
          <div className="space-y-3">
            {workouts.map((w) => {
              const isExpanded = expandedWorkoutId === w.id;
              const totalSets = w.exercises.reduce(
                (sum, e) => sum + e.sets.filter((s) => s.completed).length,
                0
              );
              const failureSets = w.exercises.reduce(
                (sum, e) => sum + e.sets.filter((s) => s.completed && s.toFailure).length,
                0
              );

              return (
                <div
                  key={w.id}
                  className="border border-zinc-800 bg-zinc-950 overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedWorkoutId(isExpanded ? null : w.id)}
                    className="w-full text-left p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-900/50 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase">
                          {w.date} • {w.durationMinutes} MIN
                        </span>
                        {w.routineScaleSlot && (
                          <span className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 text-zinc-300 text-[9px] font-mono">
                            {w.routineScaleSlot}
                          </span>
                        )}
                      </div>
                      <h4 className="font-hud font-bold text-sm sm:text-base text-white">
                        {w.name}
                      </h4>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-center">
                      <div className="text-right font-mono text-xs">
                        <span className="text-white font-bold block">
                          {(w.totalVolumeKg || 0).toLocaleString()} kg • {w.caloriesBurned || Math.round((w.totalVolumeKg || 0) * 0.05 + (w.durationMinutes || 45) * 6)} kcal
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          {totalSets} séries {failureSets > 0 && `• ${failureSets} falhas`}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-zinc-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-zinc-400" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Exercise & Sets View */}
                  {isExpanded && (
                    <div className="border-t border-zinc-800 p-4 bg-black/60 space-y-3">
                      {w.exercises.map((ex) => (
                        <div
                          key={ex.id}
                          className="border border-zinc-800/80 bg-black p-3 space-y-2"
                        >
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="font-bold text-white">{ex.name}</span>
                            <span className="text-[10px] text-zinc-500">
                              {ex.muscleGroup} • Máx: {ex.personalRecordKg}kg
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-1">
                            {ex.sets
                              .filter((s) => s.completed)
                              .map((s) => (
                                <div
                                  key={s.setNumber}
                                  className={`px-2 py-1 border text-[11px] font-mono flex items-center gap-1 ${
                                    s.toFailure
                                      ? "border-rose-800 bg-rose-950/40 text-rose-300 font-bold"
                                      : "border-zinc-800 bg-zinc-900 text-zinc-300"
                                  }`}
                                >
                                  <span>#{s.setNumber}:</span>
                                  <span>{s.weightKg}kg × {s.reps}</span>
                                  {s.toFailure && (
                                    <span className="text-[9px] text-rose-400 uppercase ml-1">
                                      [FALHA{s.failureRep ? ` REP ${s.failureRep}` : ""}]
                                    </span>
                                  )}
                                </div>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
