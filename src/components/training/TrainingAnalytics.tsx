import React, { useState } from "react";
import { WorkoutSession } from "../../types";
import { ProvenanceBadge } from "../../domain/provenance";
import { generateGlobalProgressionReport, GlobalProgressionReport } from "../../domain/progressionEngine";
import { computePersonalRecords, OverallPrVault } from "../../domain/prEngine";
import { estimateOneRepMax, OneRepMaxEstimate } from "../../domain/oneRepMaxEngine";
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
  Sliders,
  Info,
  ShieldCheck,
} from "lucide-react";

interface TrainingAnalyticsProps {
  workouts: WorkoutSession[];
}

export const TrainingAnalytics: React.FC<TrainingAnalyticsProps> = ({ workouts }) => {
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "progression" | "pr_vault" | "onerm_lab">("overview");
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(workouts[0]?.id || null);

  // Interactive 1RM Calculator State
  const [calcWeight, setCalcWeight] = useState<string>("100");
  const [calcReps, setCalcReps] = useState<string>("5");
  const [calcFormula, setCalcFormula] = useState<"Epley" | "Brzycki">("Epley");

  // Run Scientific Engines
  const progressionReport: GlobalProgressionReport = generateGlobalProgressionReport(workouts);
  const prVault: OverallPrVault = computePersonalRecords(workouts, []);

  // Global aggregate metrics
  const totalSessions = workouts.length;
  const totalVolumeKg = workouts.reduce((sum, w) => sum + (w.totalVolumeKg || 0), 0);
  const avgVolumePerSession = totalSessions > 0 ? Math.round(totalVolumeKg / totalSessions) : 0;
  const totalCaloriesBurned = workouts.reduce(
    (sum, w) => sum + (w.caloriesBurned || Math.round((w.totalVolumeKg || 0) * 0.05 + (w.durationMinutes || 45) * 6)),
    0
  );
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

  workouts.forEach((w) => {
    w.exercises.forEach((ex) => {
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
        }
      });
    });
  });

  const failureRatePercent =
    totalSetsCount > 0 ? Math.round((totalFailureSetsCount / totalSetsCount) * 100) : 0;

  // Interactive 1RM live estimation
  const live1RM: OneRepMaxEstimate | null = estimateOneRepMax(
    Number(calcWeight) || 100,
    Number(calcReps) || 5,
    calcFormula
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Sub-tab Navigation */}
      <div className="flex border-b border-zinc-800 text-xs font-mono">
        <button
          onClick={() => setActiveSubTab("overview")}
          className={`px-4 py-2 border-b-2 uppercase transition-all ${
            activeSubTab === "overview"
              ? "border-white text-white font-bold bg-zinc-900/30"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Visão Geral & Grupos Musculares
        </button>
        <button
          onClick={() => setActiveSubTab("progression")}
          className={`px-4 py-2 border-b-2 uppercase transition-all ${
            activeSubTab === "progression"
              ? "border-white text-white font-bold bg-zinc-900/30"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Motor de Sobrecarga & Progressão
        </button>
        <button
          onClick={() => setActiveSubTab("pr_vault")}
          className={`px-4 py-2 border-b-2 uppercase transition-all ${
            activeSubTab === "pr_vault"
              ? "border-white text-white font-bold bg-zinc-900/30"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Cofre de PRs ({prVault.strengthPrs.length} Exercícios)
        </button>
        <button
          onClick={() => setActiveSubTab("onerm_lab")}
          className={`px-4 py-2 border-b-2 uppercase transition-all ${
            activeSubTab === "onerm_lab"
              ? "border-white text-white font-bold bg-zinc-900/30"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Calculadora Submáxima de 1RM
        </button>
      </div>

      {/* SUB-TAB 1: OVERVIEW & SESSIONS */}
      {activeSubTab === "overview" && (
        <div className="space-y-6">
          {/* Overview Top Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="border border-zinc-800 bg-black p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                  GASTO ESTIMADO
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
                Taxa de esforço máx.: {failureRatePercent}%
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
                {prVault.totalStrengthPrs}
              </div>
              <span className="text-[10px] font-mono text-zinc-500 block">
                Recordes catalogados em {prVault.strengthPrs.length} exercícios
              </span>
            </div>
          </div>

          {/* Muscle Group Weekly Volume Distribution */}
          <div className="border border-zinc-800 bg-black p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">
                  BALANÇO BIOMECÂNICO // HIPERTROFIA (SCHOENFELD ET AL., 2017)
                </span>
                <h3 className="text-base font-hud font-bold text-white tracking-wider">
                  DISTRIBUIÇÃO DE SÉRIES POR GRUPO MUSCULAR
                </h3>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">
                Faixa Efetiva: 10 a 20 séries/semana
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(muscleSetsMap).map(([muscle, count]) => {
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
                      <span>{count < 8 ? "Volume Baixo" : count <= 18 ? "Faixa Ideal" : "Volume Elevado"}</span>
                      <span>{percentOfIdeal}% da referência</span>
                    </div>
                  </div>
                );
              })}
            </div>
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
                            <span className="text-[9px] font-mono px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400">
                              {w.exercises.length} EXERCÍCIOS
                            </span>
                          </div>
                          <h4 className="text-sm font-hud font-bold text-white">{w.routineName}</h4>
                        </div>

                        <div className="flex items-center gap-4 text-xs font-mono">
                          <div className="text-right">
                            <span className="text-white font-bold block">
                              {w.totalVolumeKg?.toLocaleString() || 0} kg
                            </span>
                            <span className="text-[10px] text-zinc-500">
                              {totalSets} séries ({failureSets} na falha)
                            </span>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-zinc-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-zinc-400" />
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-zinc-800/80 p-4 bg-black space-y-3 font-mono text-xs">
                          {w.exercises.map((ex, eIdx) => (
                            <div
                              key={eIdx}
                              className="border border-zinc-900 p-3 bg-[#080808] space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-white text-xs">{ex.name}</span>
                                <span className="text-[10px] text-zinc-400 uppercase">
                                  {ex.muscleGroup}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                                {ex.sets.map((s, sIdx) => (
                                  <div
                                    key={sIdx}
                                    className={`p-2 border ${
                                      s.completed
                                        ? "border-zinc-800 bg-zinc-950 text-zinc-300"
                                        : "border-zinc-900 bg-black text-zinc-600"
                                    }`}
                                  >
                                    <span className="text-[9px] text-zinc-500 block">
                                      SÉRIE {sIdx + 1} {s.toFailure ? "• FALHA" : s.rir !== undefined ? `• RIR ${s.rir}` : ""}
                                    </span>
                                    <span className="font-bold text-white">
                                      {s.weightKg} kg × {s.reps} reps
                                    </span>
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
      )}

      {/* SUB-TAB 2: PROGRESSION ENGINE (Requirement 20) */}
      {activeSubTab === "progression" && (
        <div className="border border-zinc-800 bg-black p-5 space-y-5 font-mono text-xs">
          <div className="border-b border-zinc-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest block">
                MOTOR DE PROGRESSÃO DETERMINÍSTICO // SOBRECARGA PROGRESSIVA REAL
              </span>
              <h3 className="text-base font-hud font-bold text-white tracking-wider">
                DIAGNÓSTICO DE CARGA & ADAPTAÇÃO MECÂNICA
              </h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 border border-zinc-700 bg-zinc-900 text-zinc-300">
              TENDÊNCIA GERAL: {progressionReport.overallTrend}
            </span>
          </div>

          <p className="text-zinc-400">
            {progressionReport.summary}
          </p>

          <div className="text-[11px] text-zinc-500 border border-zinc-900 p-2 bg-[#050505]">
            Regra Científica: Não é gerada inferência de progressão sem histórico mínimo suficiente de 2 sessões.
          </div>

          {/* Exercise Progression Table */}
          {progressionReport.exercisesAnalyzed.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 border border-zinc-900 bg-[#050505]">
              Aguardando ao menos 2 sessões de treino para detecção de sobrecarga progressiva e delta de carga.
            </div>
          ) : (
            <div className="space-y-3">
              {progressionReport.exercisesAnalyzed.map((item, idx) => (
                <div key={idx} className="border border-zinc-800 bg-[#080808] p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-900 pb-2">
                    <div>
                      <span className="font-hud font-bold text-white text-sm">{item.exerciseName}</span>
                      <span className="text-[10px] text-zinc-500 ml-2">({item.sessionsAnalyzed} sessões analisadas)</span>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 border uppercase font-bold ${
                        item.status === "PROGRESSION"
                          ? "border-emerald-500 text-emerald-400 bg-emerald-950/20"
                          : item.status === "STAGNATION"
                          ? "border-amber-500 text-amber-400 bg-amber-950/20"
                          : item.status === "REGRESSION"
                          ? "border-rose-500 text-rose-400 bg-rose-950/20"
                          : "border-zinc-700 text-zinc-400 bg-zinc-900"
                      }`}
                    >
                      {item.statusLabel}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-black p-2 border border-zinc-850">
                      <span className="text-zinc-500 text-[10px] block">Delta Carga Máx.</span>
                      <span className={`text-base font-bold ${item.loadDeltaKg > 0 ? "text-emerald-400" : item.loadDeltaKg < 0 ? "text-rose-400" : "text-white"}`}>
                        {item.loadDeltaKg > 0 ? `+${item.loadDeltaKg}` : item.loadDeltaKg} kg
                      </span>
                    </div>

                    <div className="bg-black p-2 border border-zinc-850">
                      <span className="text-zinc-500 text-[10px] block">Delta Repetições</span>
                      <span className={`text-base font-bold ${item.repsDelta > 0 ? "text-emerald-400" : item.repsDelta < 0 ? "text-rose-400" : "text-white"}`}>
                        {item.repsDelta > 0 ? `+${item.repsDelta}` : item.repsDelta} reps
                      </span>
                    </div>

                    <div className="bg-black p-2 border border-zinc-850">
                      <span className="text-zinc-500 text-[10px] block">Delta Volume</span>
                      <span className={`text-base font-bold ${item.percentVolumeChange > 0 ? "text-emerald-400" : item.percentVolumeChange < 0 ? "text-rose-400" : "text-white"}`}>
                        {item.percentVolumeChange > 0 ? `+${item.percentVolumeChange}` : item.percentVolumeChange}%
                      </span>
                    </div>

                    <div className="bg-black p-2 border border-zinc-850">
                      <span className="text-zinc-500 text-[10px] block">Estagnação?</span>
                      <span className={`text-base font-bold ${item.isStagnant ? "text-amber-400" : "text-white"}`}>
                        {item.isStagnant ? `SIM (${item.consecutiveStagnantSessions}x)` : "NÃO"}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-400 italic">
                    Recomendação: {item.recommendation}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: PR VAULT (Requirement 21) */}
      {activeSubTab === "pr_vault" && (
        <div className="border border-zinc-800 bg-black p-5 space-y-5 font-mono text-xs">
          <div className="border-b border-zinc-800 pb-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest block">
                SISTEMA DE PERSONAL RECORDS // RECORDES VERIFICADOS
              </span>
              <h3 className="text-base font-hud font-bold text-white tracking-wider">
                COFRE DE RECORDES PESSOAIS ({prVault.strengthPrs.length} EXERCÍCIOS)
              </h3>
            </div>
            <Award className="w-5 h-5 text-white" />
          </div>

          <p className="text-zinc-400">
            Recordes Pessoais (PRs) são computados de forma determinística a partir de séries concluídas no histórico. Nenhuma marca fictícia é atribuída sem comprovação de execução.
          </p>

          {prVault.strengthPrs.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 border border-zinc-900 bg-[#050505]">
              Nenhum recorde registrado ainda. Complete treinos e séries para que suas marcas sejam catalogadas.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {prVault.strengthPrs.map((rec) => (
                <div key={rec.exerciseName} className="border border-zinc-800 bg-[#080808] p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                    <span className="font-hud font-bold text-white text-base">{rec.exerciseName}</span>
                    <span className="text-[10px] text-zinc-400 uppercase">
                      1RM Est: {rec.estimated1RmMax.valueKg} kg ({rec.estimated1RmMax.formula})
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <div className="bg-black p-2 border border-zinc-800">
                      <span className="text-zinc-500 text-[10px] uppercase block">Maior Carga</span>
                      <span className="text-white font-bold text-sm">{rec.maxLoad.valueKg} kg</span>
                      <span className="text-[9px] text-zinc-500 block">× {rec.maxLoad.repsAchieved} reps</span>
                      <span className="text-[9px] text-zinc-600 block">{rec.maxLoad.date}</span>
                    </div>

                    <div className="bg-black p-2 border border-zinc-800">
                      <span className="text-zinc-500 text-[10px] uppercase block">Maior Volume Série</span>
                      <span className="text-white font-bold text-sm">{rec.maxSetVolumeKg.volumeKg} kg</span>
                      <span className="text-[9px] text-zinc-500 block">({rec.maxSetVolumeKg.weightKg}k × {rec.maxSetVolumeKg.reps}r)</span>
                      <span className="text-[9px] text-zinc-600 block">{rec.maxSetVolumeKg.date}</span>
                    </div>

                    <div className="bg-black p-2 border border-zinc-800">
                      <span className="text-zinc-500 text-[10px] uppercase block">Maior Repetição</span>
                      <span className="text-white font-bold text-sm">{rec.maxReps.reps} reps</span>
                      <span className="text-[9px] text-zinc-500 block">com {rec.maxReps.weightKg} kg</span>
                      <span className="text-[9px] text-zinc-600 block">{rec.maxReps.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 4: 1RM SUBMAXIMAL CALCULATOR & LABORATORY (Requirement 22) */}
      {activeSubTab === "onerm_lab" && (
        <div className="border border-zinc-800 bg-black p-5 space-y-5 font-mono text-xs">
          <div className="border-b border-zinc-800 pb-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest block">
                LABORATÓRIO DE CARGA SUBMÁXIMA // EPLEY & BRZYCKI EQUATIONS
              </span>
              <h3 className="text-base font-hud font-bold text-white tracking-wider">
                CALCULADORA CIENTÍFICA DE 1RM & ZONAS DE FORÇA
              </h3>
            </div>
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#080808] p-4 border border-zinc-800">
            <div>
              <label className="text-zinc-400 block mb-1 text-[10px] uppercase">Carga Movimentada (kg)</label>
              <input
                type="number"
                value={calcWeight}
                onChange={(e) => setCalcWeight(e.target.value)}
                className="w-full bg-black border border-zinc-800 p-2 text-white font-bold outline-none"
              />
            </div>

            <div>
              <label className="text-zinc-400 block mb-1 text-[10px] uppercase">Repetições Executadas (1 a 12)</label>
              <input
                type="number"
                min="1"
                max="15"
                value={calcReps}
                onChange={(e) => setCalcReps(e.target.value)}
                className="w-full bg-black border border-zinc-800 p-2 text-white font-bold outline-none"
              />
            </div>

            <div>
              <label className="text-zinc-400 block mb-1 text-[10px] uppercase">Fórmula de Predição</label>
              <select
                value={calcFormula}
                onChange={(e) => setCalcFormula(e.target.value as "Epley" | "Brzycki")}
                className="w-full bg-black border border-zinc-800 p-2 text-white outline-none"
              >
                <option value="Epley">Epley (Padrão Ouro Força Geral: w * (1 + r/30))</option>
                <option value="Brzycki">Brzycki (Excelente 1 a 6 reps: w * (36 / (37 - r)))</option>
              </select>
            </div>
          </div>

          {/* Results Display */}
          {!live1RM ? (
            <div className="p-8 text-center text-zinc-500 border border-zinc-900 bg-[#050505]">
              Insira valores válidos (carga &gt; 0 e repetições entre 1 e 12). Fórmulas submáximas perdem validade científica acima de 12 repetições.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#050505] border border-zinc-800 p-4 space-y-2">
                  <span className="text-zinc-500 text-[10px] uppercase block">1RM Estimada Primária</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-white font-hud">{live1RM.estimated1RmKg}</span>
                    <span className="text-zinc-500 text-sm">KG</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 block">
                    Fórmula: {live1RM.primaryFormula} ({live1RM.formulaEquation})
                  </span>
                  <span className="text-[10px] text-zinc-500 block">
                    Confiabilidade Científica: {live1RM.reliability}
                  </span>
                </div>

                <div className="bg-[#050505] border border-zinc-800 p-4 space-y-2">
                  <span className="text-zinc-500 text-[10px] uppercase block">Notas Biomecânicas</span>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    {live1RM.scientificNotes}
                  </p>
                  <span className="text-[10px] text-zinc-500 block">
                    Estimativas submáximas assumem esforço máximo real na série informada.
                  </span>
                </div>

                <div className="bg-[#050505] border border-zinc-800 p-4 space-y-2">
                  <span className="text-zinc-500 text-[10px] uppercase block">Comparação Multi-Equação</span>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">{live1RM.primaryFormula}:</span>
                      <span className="text-white font-bold">{live1RM.estimated1RmKg} kg</span>
                    </div>
                    {live1RM.alternatives.map((alt) => (
                      <div key={alt.formulaName} className="flex justify-between">
                        <span className="text-zinc-400">{alt.formulaName}:</span>
                        <span className="text-white font-bold">{alt.valueKg} kg</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Intensity Zones */}
              <div className="bg-[#080808] border border-zinc-800 p-4 space-y-3">
                <span className="text-white font-bold text-xs uppercase block">
                  TABELA DE INTENSIDADE BASEADA NA 1RM ESTIMADA ({live1RM.estimated1RmKg} KG)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center">
                  {[
                    { pct: 95, reps: "1-2 reps" },
                    { pct: 90, reps: "3-4 reps" },
                    { pct: 85, reps: "5-6 reps" },
                    { pct: 80, reps: "7-8 reps" },
                    { pct: 75, reps: "9-10 reps" },
                    { pct: 70, reps: "11-12 reps" },
                  ].map((z) => (
                    <div key={z.pct} className="p-2 border border-zinc-850 bg-black">
                      <span className="text-[10px] text-zinc-500 uppercase block">{z.pct}% 1RM</span>
                      <span className="text-white font-bold text-sm block">{Math.round(live1RM.estimated1RmKg * (z.pct / 100))} kg</span>
                      <span className="text-[9px] text-zinc-400 block">{z.reps}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>{live1RM.disclaimer}</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
