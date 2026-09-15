import React, { useState } from "react";
import { SleepMetrics, MoodLog } from "../types";
import { evaluateRecovery, GLReadinessIndex } from "../domain/recoveryEngine";
import {
  Moon,
  Heart,
  BatteryCharging,
  Zap,
  Info,
  Plus,
  X,
  Smile,
  ShieldAlert,
  Sliders,
  Check,
} from "lucide-react";

interface SleepRecoveryModuleProps {
  sleep: SleepMetrics;
  recentMood?: MoodLog | null;
  onUpdateSleep?: (sleep: SleepMetrics) => void;
  onUpdateMood?: (mood: MoodLog) => void;
}

export const SleepRecoveryModule: React.FC<SleepRecoveryModuleProps> = ({
  sleep,
  recentMood,
  onUpdateSleep,
  onUpdateMood,
}) => {
  const [activeTab, setActiveTab] = useState<"readiness" | "stages" | "subjective">("readiness");
  const [showLogModal, setShowLogModal] = useState(false);
  const [showSubjectiveModal, setShowSubjectiveModal] = useState(false);

  // Form inputs for Sleep - Pure blank inputs (NO FAKE DEFAULTS)
  const [bedTime, setBedTime] = useState("");
  const [wakeTime, setWakeTime] = useState("");
  const [duration, setDuration] = useState("");
  const [hrv, setHrv] = useState("");
  const [restingHr, setRestingHr] = useState("");
  const [deepPercent, setDeepPercent] = useState("");
  const [remPercent, setRemPercent] = useState("");
  const [awakeMins, setAwakeMins] = useState("");

  // Form inputs for Subjective Check-in (SELF_REPORTED / REAL)
  const [energyLevel, setEnergyLevel] = useState("7");
  const [stressLevel, setStressLevel] = useState("4");
  const [motivationLevel, setMotivationLevel] = useState("8");
  const [sorenessDoms, setSorenessDoms] = useState("3");
  const [perceivedRecovery, setPerceivedRecovery] = useState("7");
  const [subjectiveMood, setSubjectiveMood] = useState<"EXCELLENT" | "GOOD" | "NEUTRAL" | "TIRED" | "STRESSED">("GOOD");
  const [subjectiveNotes, setSubjectiveNotes] = useState("");

  const isZeroState = !sleep || sleep.durationHours === 0;

  // Run the scientific recovery engine deterministically
  const recoveryReport: GLReadinessIndex = evaluateRecovery(sleep, recentMood);

  const handleSaveSleep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateSleep) return;

    const dur = Number(duration);
    if (!dur || dur <= 0) {
      alert("Por favor, informe a duração de sono válida em horas.");
      return;
    }

    const dPercent = Number(deepPercent) || 0;
    const rPercent = Number(remPercent) || 0;
    const hrvVal = Number(hrv) || 0;
    const rHrVal = Number(restingHr) || 0;
    const awVal = Number(awakeMins) || 0;

    // Temporary mock for light sleep if stages were provided
    const lightPercent = dPercent + rPercent > 0 ? Math.max(0, 100 - dPercent - rPercent) : 0;

    const updated: SleepMetrics = {
      durationHours: dur,
      bedTime: bedTime || "--:--",
      wakeTime: wakeTime || "--:--",
      consistencyPercent: 85,
      deepSleepPercent: dPercent,
      remSleepPercent: rPercent,
      lightSleepPercent: lightPercent,
      awakeMinutes: awVal,
      restingHeartRateBpm: rHrVal,
      hrvMs: hrvVal,
      recoveryScore: 0, // Computed live by recoveryEngine
    };

    onUpdateSleep(updated);
    setShowLogModal(false);

    // Reset input fields
    setBedTime("");
    setWakeTime("");
    setDuration("");
    setHrv("");
    setRestingHr("");
    setDeepPercent("");
    setRemPercent("");
    setAwakeMins("");
  };

  const handleSaveSubjective = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateMood) return;

    const newMoodLog: MoodLog = {
      id: "mood_" + Date.now(),
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      mood: subjectiveMood,
      energyLevel: Number(energyLevel) || 7,
      stressLevel: Number(stressLevel) || 4,
      mentalFocus: Number(motivationLevel) || 7,
      motivationLevel: Number(motivationLevel) || 7,
      sorenessDoms: Number(sorenessDoms) || 3,
      perceivedRecovery: Number(perceivedRecovery) || 7,
      notes: subjectiveNotes.trim() || undefined,
      classification: "SELF_REPORTED / REAL",
    };

    onUpdateMood(newMoodLog);
    setShowSubjectiveModal(false);
  };

  const confidenceBadgeColors: Record<string, string> = {
    HIGH: "border-emerald-400 text-emerald-400 bg-emerald-950/20",
    MODERATE: "border-zinc-400 text-zinc-300 bg-zinc-900",
    LOW: "border-amber-400 text-amber-400 bg-amber-950/20",
    INSUFFICIENT_DATA: "border-zinc-700 text-zinc-500 bg-black",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800 pb-4 gap-3">
        <div>
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">
            GYM LABS // LABCORE NEUROLOGICAL & AUTONOMIC RECOVERY
          </span>
          <h2 className="font-hud font-bold text-xl sm:text-2xl text-white tracking-wider flex items-center gap-2">
            <Moon className="w-5 h-5 text-white" />
            03 // SLEEP & READINESS LAB
          </h2>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">
            Avaliação de arquitetura circadiana, variabilidade autonômica (HRV) e percepção subjetiva autorreferida.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowSubjectiveModal(true)}
            className="px-3 py-1.5 bg-black hover:bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white font-mono text-xs flex items-center gap-1.5 transition-colors"
          >
            <Smile className="w-3.5 h-3.5" />
            <span>CHECK-IN SUBJETIVO</span>
          </button>
          <button
            onClick={() => setShowLogModal(true)}
            className="px-3.5 py-1.5 bg-white hover:bg-zinc-200 text-black font-hud font-bold text-xs uppercase flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>REGISTRAR SONO</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-zinc-800 text-xs font-mono">
        <button
          onClick={() => setActiveTab("readiness")}
          className={`px-4 py-2 border-b-2 uppercase transition-all ${
            activeTab === "readiness"
              ? "border-white text-white font-bold bg-zinc-900/30"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          GL Readiness Index & Biomarcadores
        </button>
        <button
          onClick={() => setActiveTab("stages")}
          className={`px-4 py-2 border-b-2 uppercase transition-all ${
            activeTab === "stages"
              ? "border-white text-white font-bold bg-zinc-900/30"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Arquitetura & Fases de Sono
        </button>
        <button
          onClick={() => setActiveTab("subjective")}
          className={`px-4 py-2 border-b-2 uppercase transition-all ${
            activeTab === "subjective"
              ? "border-white text-white font-bold bg-zinc-900/30"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Check-in Subjetivo [Real]
        </button>
      </div>

      {/* TAB 1: READINESS & BIOMARKERS */}
      {activeTab === "readiness" && (
        <div className="space-y-4">
          {/* Main Triple Column: GL Readiness Index | HRV | Resting HR */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 1. GL READINESS INDEX */}
            <div className="bg-black border border-zinc-800 p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                  GL READINESS INDEX
                </span>
                <span
                  className={`text-[9px] font-mono px-2 py-0.5 border uppercase ${
                    confidenceBadgeColors[recoveryReport.confidence]
                  }`}
                >
                  CONFIANÇA: {recoveryReport.confidence}
                </span>
              </div>

              <div className="my-4">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                    {recoveryReport.score !== null ? recoveryReport.score : "--"}
                  </span>
                  <span className="font-mono text-sm text-zinc-500">/ 100</span>
                </div>
                <span className="text-xs font-mono text-zinc-300 block mt-2 uppercase tracking-wide">
                  {recoveryReport.categoryLabel}
                </span>
                <p className="text-[10px] font-mono text-zinc-500 mt-1">
                  {recoveryReport.derivedDisclaimer}
                </p>
              </div>

              <div className="space-y-2">
                <div className="w-full h-1.5 bg-zinc-900 border border-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-500"
                    style={{ width: `${recoveryReport.score || 0}%` }}
                  />
                </div>
                <div className="flex flex-wrap gap-1 text-[9px] font-mono text-zinc-400">
                  {recoveryReport.factorsUsed.length > 0 ? (
                    recoveryReport.factorsUsed.map((f, idx) => (
                      <span key={idx} className="bg-zinc-900 px-1.5 py-0.5 border border-zinc-800">
                        • {f}
                      </span>
                    ))
                  ) : (
                    <span className="text-zinc-600">Aguardando telemetria ativa</span>
                  )}
                </div>
              </div>
            </div>

            {/* 2. HRV (R-R INTERVAL) */}
            <div className="bg-black border border-zinc-800 p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                  HRV (RMSSD AUTONÔMICO)
                </span>
                <Heart className="w-4 h-4 text-zinc-400" />
              </div>

              <div className="my-4">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                    {sleep.hrvMs > 0 ? sleep.hrvMs : "--"}
                  </span>
                  <span className="font-mono text-sm text-zinc-500">MS</span>
                </div>
                <span className="text-xs font-mono text-zinc-400 block mt-2">
                  {sleep.hrvMs > 0
                    ? `Tendência: ${recoveryReport.hrvAnalysis.trend}`
                    : "Sem telemetria basal coletada"}
                </span>
                <p className="text-[10px] font-mono text-zinc-500 mt-1">
                  {recoveryReport.hrvAnalysis.clinicalCaution}
                </p>
              </div>

              <div className="text-[10px] font-mono text-zinc-500 border-t border-zinc-900 pt-2">
                {sleep.hrvMs > 0
                  ? "Modulação parassimpática aferida em repouso noturno"
                  : "Insira a leitura do seu wearable ou monitor de cinta"}
              </div>
            </div>

            {/* 3. RESTING HEART RATE */}
            <div className="bg-black border border-zinc-800 p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                  FC REPOUSO BASAL
                </span>
                <Zap className="w-4 h-4 text-zinc-400" />
              </div>

              <div className="my-4">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                    {sleep.restingHeartRateBpm > 0 ? sleep.restingHeartRateBpm : "--"}
                  </span>
                  <span className="font-mono text-sm text-zinc-500">BPM</span>
                </div>
                <span className="text-xs font-mono text-zinc-400 block mt-2">
                  {sleep.restingHeartRateBpm > 0
                    ? "Frequência cardíaca basal aferida no sono"
                    : "Sem medição de repouso registrada"}
                </span>
                <p className="text-[10px] font-mono text-zinc-500 mt-1">
                  Valores basais mais baixos indicam adaptação vagal e eficiência de ejeção ventricular.
                </p>
              </div>

              <div className="text-[10px] font-mono text-zinc-500 border-t border-zinc-900 pt-2">
                Média esperada para praticantes ativos: 48 - 62 bpm
              </div>
            </div>
          </div>

          {/* Transparent Sleep Score Breakdown (Requirement 28) */}
          <div className="bg-black border border-zinc-800 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
              <h3 className="font-hud font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-zinc-400" />
                COMPONENTES AUDITÁVEIS DO SCORE DE SONO (AASM 2014)
              </h3>
              <span className="text-xs font-mono text-zinc-400">
                Score Total: {recoveryReport.sleepScoreBreakdown.totalSleepScore !== null ? `${recoveryReport.sleepScoreBreakdown.totalSleepScore}/100` : "--"}
              </span>
            </div>

            {isZeroState ? (
              <div className="p-6 text-center text-xs font-mono text-zinc-500">
                Nenhum registro de sono no sistema. Clique em [REGISTRAR SONO] para iniciar o histórico.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {recoveryReport.sleepScoreBreakdown.components.map((comp, idx) => (
                  <div key={idx} className="bg-[#080808] border border-zinc-800 p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-zinc-300 font-semibold">{comp.component}</span>
                      <span className="text-white font-bold">{comp.score}/100</span>
                    </div>
                    <div className="w-full h-1 bg-zinc-900 overflow-hidden">
                      <div className="h-full bg-white" style={{ width: `${comp.score}%` }} />
                    </div>
                    <div className="text-[10px] font-mono text-zinc-400">
                      <div>Valor: <span className="text-zinc-200">{comp.valueDescription}</span></div>
                      <div className="text-zinc-500">Meta: {comp.targetDescription}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: STAGES & ARCHITECTURE */}
      {activeTab === "stages" && (
        <div className="bg-black border border-zinc-800 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-900 pb-3">
            <div className="flex items-center gap-2.5">
              <Moon className="w-4 h-4 text-white" />
              <h3 className="font-hud font-bold text-white text-base tracking-wider uppercase">
                ARQUITETURA DE FASES DO SONO
              </h3>
            </div>
            <span className="text-xs font-mono text-zinc-400">
              {sleep.bedTime} → {sleep.wakeTime} ({sleep.durationHours}h TOTAL)
            </span>
          </div>

          {isZeroState ? (
            <div className="border border-zinc-900 bg-[#050505] p-8 text-center space-y-2">
              <span className="text-zinc-500 text-xs font-mono block">
                [ NENHUM REGISTRO DE FASES DE SONO ]
              </span>
              <p className="text-xs text-zinc-400 font-mono max-w-md mx-auto">
                Registre os dados da sua noite (ou importe do seu smartwatch) para visualizar a proporção de sono profundo (N3) e REM.
              </p>
              <button
                onClick={() => setShowLogModal(true)}
                className="mt-3 px-4 py-2 border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-mono uppercase"
              >
                + REGISTRAR SONO
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-full h-4 bg-zinc-900 border border-zinc-800 flex overflow-hidden">
                <div
                  style={{ width: `${sleep.deepSleepPercent}%` }}
                  className="bg-zinc-300 border-r border-black"
                  title="Profundo (N3)"
                />
                <div
                  style={{ width: `${sleep.remSleepPercent}%` }}
                  className="bg-zinc-500 border-r border-black"
                  title="REM"
                />
                <div
                  style={{ width: `${sleep.lightSleepPercent}%` }}
                  className="bg-zinc-700 border-r border-black"
                  title="Leve (N1/N2)"
                />
                <div
                  style={{ width: `${Math.min(15, (sleep.awakeMinutes / (sleep.durationHours * 60)) * 100)}%` }}
                  className="bg-zinc-900"
                  title="Vigília"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="bg-[#080808] p-3 border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
                    PROFUNDO (N3)
                  </span>
                  <span className="text-white font-bold text-lg">{sleep.deepSleepPercent}%</span>
                  <span className="text-[10px] text-zinc-500 block mt-1">Reparação física & GH</span>
                </div>
                <div className="bg-[#080808] p-3 border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
                    REM
                  </span>
                  <span className="text-white font-bold text-lg">{sleep.remSleepPercent}%</span>
                  <span className="text-[10px] text-zinc-500 block mt-1">Consolidação de memória</span>
                </div>
                <div className="bg-[#080808] p-3 border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
                    LEVE (N1/N2)
                  </span>
                  <span className="text-white font-bold text-lg">{sleep.lightSleepPercent}%</span>
                  <span className="text-[10px] text-zinc-500 block mt-1">Transição e descanso</span>
                </div>
                <div className="bg-[#080808] p-3 border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
                    VIGÍLIA INTRA-SONO
                  </span>
                  <span className="text-white font-bold text-lg">{sleep.awakeMinutes} MIN</span>
                  <span className="text-[10px] text-zinc-500 block mt-1">Eficiência de sono</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SUBJECTIVE CHECK-IN [SELF_REPORTED / REAL] (Requirement 29) */}
      {activeTab === "subjective" && (
        <div className="bg-black border border-zinc-800 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono px-2 py-0.5 border border-zinc-700 bg-zinc-900 text-zinc-300">
                  CLASSIFICAÇÃO: SELF_REPORTED / REAL
                </span>
              </div>
              <h3 className="font-hud font-bold text-white text-base tracking-wider uppercase mt-1">
                REGISTRO SUBJETIVO PSICOFISIOLÓGICO
              </h3>
            </div>
            <button
              onClick={() => setShowSubjectiveModal(true)}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-mono text-xs uppercase"
            >
              + NOVO CHECK-IN
            </button>
          </div>

          {recentMood ? (
            <div className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-[#080808] border border-zinc-800 p-3">
                  <span className="text-zinc-500 block text-[10px] uppercase">Energia Percebida</span>
                  <span className="text-white text-xl font-bold">{recentMood.energyLevel || "--"}/10</span>
                </div>
                <div className="bg-[#080808] border border-zinc-800 p-3">
                  <span className="text-zinc-500 block text-[10px] uppercase">Estresse Percebido</span>
                  <span className="text-white text-xl font-bold">{recentMood.stressLevel || "--"}/10</span>
                </div>
                <div className="bg-[#080808] border border-zinc-800 p-3">
                  <span className="text-zinc-500 block text-[10px] uppercase">Motivação p/ Treino</span>
                  <span className="text-white text-xl font-bold">{recentMood.motivationLevel || "--"}/10</span>
                </div>
                <div className="bg-[#080808] border border-zinc-800 p-3">
                  <span className="text-zinc-500 block text-[10px] uppercase">Dor Muscular (DOMS)</span>
                  <span className="text-white text-xl font-bold">{recentMood.sorenessDoms || "--"}/10</span>
                </div>
                <div className="bg-[#080808] border border-zinc-800 p-3">
                  <span className="text-zinc-500 block text-[10px] uppercase">Humor Declarado</span>
                  <span className="text-white text-sm font-bold uppercase">{recentMood.mood}</span>
                </div>
              </div>

              {recentMood.notes && (
                <div className="bg-[#080808] border border-zinc-800 p-3">
                  <span className="text-zinc-500 text-[10px] block mb-1 uppercase">Observações do Atleta:</span>
                  <p className="text-zinc-300 italic">"{recentMood.notes}"</p>
                </div>
              )}

              <div className="text-[10px] text-zinc-500 border-t border-zinc-900 pt-2">
                Último registro em: {recentMood.date} às {recentMood.time}. Registro puramente subjetivo autorreferido; não constitui laudo clínico.
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs font-mono text-zinc-500 border border-zinc-900 bg-[#050505]">
              Nenhum check-in subjetivo registrado hoje. Clique em [+ NOVO CHECK-IN] para registrar seu estado psicofisiológico.
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: REGISTRAR SONO */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-black border border-zinc-700 max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-hud font-bold text-white text-base uppercase">
                REGISTRO REAL DE TELEMETRIA DE SONO
              </h3>
              <button
                onClick={() => setShowLogModal(false)}
                className="text-zinc-500 hover:text-white font-mono text-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSleep} className="space-y-3 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1 uppercase font-mono text-[10px]">
                    Horário de Deitar
                  </label>
                  <input
                    type="time"
                    value={bedTime}
                    onChange={(e) => setBedTime(e.target.value)}
                    className="w-full bg-[#080808] border border-zinc-800 p-2 text-white outline-none focus:border-white"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1 uppercase font-mono text-[10px]">
                    Horário de Acordar
                  </label>
                  <input
                    type="time"
                    value={wakeTime}
                    onChange={(e) => setWakeTime(e.target.value)}
                    className="w-full bg-[#080808] border border-zinc-800 p-2 text-white outline-none focus:border-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-zinc-400 block mb-1 uppercase font-mono text-[10px]">
                    Duração Total (h) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 7.5"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    required
                    className="w-full bg-[#080808] border border-zinc-800 p-2 text-white font-bold outline-none focus:border-white"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1 uppercase font-mono text-[10px]">
                    HRV (ms, opcional)
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 62"
                    value={hrv}
                    onChange={(e) => setHrv(e.target.value)}
                    className="w-full bg-[#080808] border border-zinc-800 p-2 text-white font-bold outline-none focus:border-white"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1 uppercase font-mono text-[10px]">
                    FC Repouso (bpm)
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 54"
                    value={restingHr}
                    onChange={(e) => setRestingHr(e.target.value)}
                    className="w-full bg-[#080808] border border-zinc-800 p-2 text-white font-bold outline-none focus:border-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-zinc-900">
                <div>
                  <label className="text-zinc-400 block mb-1 uppercase font-mono text-[10px]">
                    Profundo (%)
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 20"
                    value={deepPercent}
                    onChange={(e) => setDeepPercent(e.target.value)}
                    className="w-full bg-[#080808] border border-zinc-800 p-2 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1 uppercase font-mono text-[10px]">
                    REM (%)
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 22"
                    value={remPercent}
                    onChange={(e) => setRemPercent(e.target.value)}
                    className="w-full bg-[#080808] border border-zinc-800 p-2 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1 uppercase font-mono text-[10px]">
                    Vigília (min)
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 15"
                    value={awakeMins}
                    onChange={(e) => setAwakeMins(e.target.value)}
                    className="w-full bg-[#080808] border border-zinc-800 p-2 text-white outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-zinc-900">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 border border-zinc-800 bg-black text-zinc-400 text-xs font-mono uppercase"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-white hover:bg-zinc-200 text-black font-hud font-bold text-xs uppercase"
                >
                  SALVAR REGISTRO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CHECK-IN SUBJETIVO (SELF_REPORTED / REAL) */}
      {showSubjectiveModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-black border border-zinc-700 max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">
                  CLASSIFICAÇÃO: SELF_REPORTED / REAL
                </span>
                <h3 className="font-hud font-bold text-white text-base uppercase">
                  CHECK-IN PSICOFISIOLÓGICO SUBJETIVO
                </h3>
              </div>
              <button
                onClick={() => setShowSubjectiveModal(false)}
                className="text-zinc-500 hover:text-white font-mono text-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubjective} className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-zinc-300 block mb-1 uppercase text-[10px]">
                  Estado de Humor Geral:
                </label>
                <div className="grid grid-cols-5 gap-1 text-[10px]">
                  {(["EXCELLENT", "GOOD", "NEUTRAL", "TIRED", "STRESSED"] as const).map((m) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setSubjectiveMood(m)}
                      className={`p-2 border text-center font-mono uppercase transition-all ${
                        subjectiveMood === m
                          ? "border-white bg-white text-black font-bold"
                          : "border-zinc-800 bg-[#080808] text-zinc-400"
                      }`}
                    >
                      {m === "EXCELLENT" ? "Ótimo" : m === "GOOD" ? "Bom" : m === "NEUTRAL" ? "Neutro" : m === "TIRED" ? "Cansado" : "Tenso"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-900">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-zinc-400">Nível de Energia:</span>
                    <span className="text-white font-bold">{energyLevel} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={energyLevel}
                    onChange={(e) => setEnergyLevel(e.target.value)}
                    className="w-full accent-white"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-zinc-400">Nível de Estresse Mental:</span>
                    <span className="text-white font-bold">{stressLevel} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={stressLevel}
                    onChange={(e) => setStressLevel(e.target.value)}
                    className="w-full accent-white"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-zinc-400">Motivação para Treinar:</span>
                    <span className="text-white font-bold">{motivationLevel} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={motivationLevel}
                    onChange={(e) => setMotivationLevel(e.target.value)}
                    className="w-full accent-white"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-zinc-400">Dor Muscular de Início Tardio (DOMS):</span>
                    <span className="text-white font-bold">{sorenessDoms} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={sorenessDoms}
                    onChange={(e) => setSorenessDoms(e.target.value)}
                    className="w-full accent-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1 uppercase text-[10px]">
                  Notas / Percepções (Opcional):
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Treino de pernas ontem exigiu muito dos adutores; apetite alto."
                  value={subjectiveNotes}
                  onChange={(e) => setSubjectiveNotes(e.target.value)}
                  className="w-full bg-[#080808] border border-zinc-800 p-2 text-white outline-none focus:border-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-zinc-900">
                <button
                  type="button"
                  onClick={() => setShowSubjectiveModal(false)}
                  className="px-4 py-2 border border-zinc-800 bg-black text-zinc-400 text-xs font-mono uppercase"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-white hover:bg-zinc-200 text-black font-hud font-bold text-xs uppercase"
                >
                  SALVAR CHECK-IN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
