import React, { useState } from "react";
import { SleepMetrics } from "../types";
import { Moon, Heart, BatteryCharging, Zap, Info, Plus, X } from "lucide-react";

interface SleepRecoveryModuleProps {
  sleep: SleepMetrics;
  onUpdateSleep?: (sleep: SleepMetrics) => void;
}

export const SleepRecoveryModule: React.FC<SleepRecoveryModuleProps> = ({
  sleep,
  onUpdateSleep,
}) => {
  const [showLogModal, setShowLogModal] = useState(false);
  const [bedTime, setBedTime] = useState("23:30");
  const [wakeTime, setWakeTime] = useState("07:00");
  const [duration, setDuration] = useState("7.5");
  const [hrv, setHrv] = useState("65");
  const [restingHr, setRestingHr] = useState("52");
  const [deepPercent, setDeepPercent] = useState("22");
  const [remPercent, setRemPercent] = useState("24");

  const isZeroState = sleep.durationHours === 0;

  const handleSaveSleep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateSleep) return;

    const dur = Number(duration) || 7.5;
    const recoveryScore = Math.min(
      100,
      Math.max(30, Math.round((dur / 8) * 50 + (Number(hrv) / 70) * 50))
    );

    const updated: SleepMetrics = {
      durationHours: dur,
      bedTime,
      wakeTime,
      consistencyPercent: 92,
      deepSleepPercent: Number(deepPercent) || 20,
      remSleepPercent: Number(remPercent) || 25,
      lightSleepPercent: 100 - (Number(deepPercent) || 20) - (Number(remPercent) || 25),
      awakeMinutes: 18,
      restingHeartRateBpm: Number(restingHr) || 54,
      hrvMs: Number(hrv) || 65,
      recoveryScore,
    };

    onUpdateSleep(updated);
    setShowLogModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800 pb-3 gap-3">
        <div>
          <span className="text-[10px] font-dot text-emerald-400 uppercase tracking-widest block mb-1">
            LAB // NEUROLOGICAL & AUTONOMIC RECOVERY
          </span>
          <h2 className="font-hud font-bold text-2xl text-white tracking-wider">
            03 // SLEEP & RECOVERY LAB
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-hud bg-black border px-3 py-1 uppercase tracking-wider ${
              isZeroState
                ? "border-amber-500/60 text-amber-400"
                : "border-emerald-400/60 text-emerald-400"
            }`}
          >
            STATUS: {isZeroState ? "[ CALIBRANDO ]" : "[ COFRE ATIVO ]"}
          </span>
          <button
            onClick={() => setShowLogModal(true)}
            className="px-3 py-1 bg-emerald-400 hover:bg-emerald-300 text-black font-hud font-bold text-xs uppercase flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>REGISTRAR SONO</span>
          </button>
        </div>
      </div>

      {/* Main Recovery Readiness Gauge & HRV */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Recovery Score */}
        <div className="bg-black border-2 border-zinc-800 p-4 flex flex-col justify-between hud-corners">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
            <span className="text-[10px] font-hud text-zinc-400 uppercase tracking-wider">
              READINESS GAUGE
            </span>
            <BatteryCharging className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="my-4">
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                {sleep.recoveryScore}
              </span>
              <span className="font-hud text-sm text-zinc-500">/ 100</span>
            </div>
            <span
              className={`text-xs font-hud block mt-2 uppercase tracking-wide ${
                isZeroState ? "text-amber-400" : "text-emerald-400"
              }`}
            >
              {isZeroState
                ? "AGUARDANDO 1º REGISTRO DE SONO"
                : "SNC RESTAURADO // PRONTO PARA CARGA"}
            </span>
          </div>

          <div className="w-full h-2.5 bg-zinc-900 border border-zinc-800 overflow-hidden">
            <div
              className={`h-full ${isZeroState ? "bg-amber-400" : "bg-emerald-400"}`}
              style={{ width: `${sleep.recoveryScore}%` }}
            />
          </div>
        </div>

        {/* HRV */}
        <div className="bg-black border-2 border-zinc-800 p-4 flex flex-col justify-between hud-corners hud-corners-cyan">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
            <span className="text-[10px] font-hud text-zinc-400 uppercase tracking-wider">
              HRV (R-R INTERVAL)
            </span>
            <Heart className="w-4 h-4 text-cyan-400" />
          </div>

          <div className="my-4">
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-4xl sm:text-5xl font-extrabold text-cyan-400 tracking-tight">
                {sleep.hrvMs > 0 ? sleep.hrvMs : "--"}
              </span>
              <span className="font-hud text-sm text-zinc-500">MS</span>
            </div>
            <span className="text-xs font-mono text-zinc-300 block mt-2">
              {sleep.hrvMs > 0
                ? "Variabilidade de frequência cardíaca"
                : "Sem telemetria basal coletada"}
            </span>
          </div>

          <span className="text-[10px] font-hud text-zinc-500 uppercase tracking-wider">
            {sleep.hrvMs > 0 ? "Tônus Parassimpático" : "Aguardando entrada"}
          </span>
        </div>

        {/* Resting Heart Rate */}
        <div className="bg-black border-2 border-zinc-800 p-4 flex flex-col justify-between hud-corners">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
            <span className="text-[10px] font-hud text-zinc-400 uppercase tracking-wider">
              FC REPOUSO BASAL
            </span>
            <Zap className="w-4 h-4 text-rose-400" />
          </div>

          <div className="my-4">
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-4xl sm:text-5xl font-extrabold text-rose-400 tracking-tight">
                {sleep.restingHeartRateBpm > 0 ? sleep.restingHeartRateBpm : "--"}
              </span>
              <span className="font-hud text-sm text-zinc-500">BPM</span>
            </div>
            <span className="text-xs font-mono text-zinc-400 block mt-2">
              {sleep.restingHeartRateBpm > 0
                ? "Frequência cardíaca em repouso"
                : "Sem medição de repouso"}
            </span>
          </div>

          <span className="text-[10px] font-hud text-zinc-500 uppercase tracking-wider">
            Eficiência cardiovascular basal
          </span>
        </div>
      </div>

      {/* Sleep Architecture & Stages */}
      <div className="bg-black border-2 border-zinc-800 p-5 space-y-4 hud-corners">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-900 pb-3">
          <div className="flex items-center gap-2.5">
            <Moon className="w-4 h-4 text-emerald-400" />
            <h3 className="font-hud font-bold text-white text-lg tracking-wider">
              ARQUITETURA DO SONO DESTA NOITE
            </h3>
          </div>
          <span className="text-xs font-mono text-zinc-400">
            {sleep.bedTime} → {sleep.wakeTime} ({sleep.durationHours}H TOTAL)
          </span>
        </div>

        {/* Stage percentage stacked bar */}
        {isZeroState ? (
          <div className="border border-zinc-800 bg-[#050505] p-6 text-center space-y-2">
            <span className="text-zinc-500 text-xs font-mono block">
              [ NENHUM REGISTRO DE SONO REGISTRADO ]
            </span>
            <p className="text-xs text-zinc-400 font-mono max-w-sm mx-auto">
              Insira o horário que foi dormir e acordou para que o algoritmo analise os estágios e a prontidão do sistema nervoso central.
            </p>
            <button
              onClick={() => setShowLogModal(true)}
              className="mt-2 px-4 py-2 border border-emerald-400 text-emerald-400 hover:bg-emerald-950/40 text-xs font-hud uppercase"
            >
              + REGISTRAR SONO DE HOJE
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-full h-3.5 bg-black border border-zinc-800 flex overflow-hidden">
              <div
                style={{ width: `${sleep.deepSleepPercent}%` }}
                className="bg-indigo-500 border-r border-black"
                title="Sono Profundo / N3"
              />
              <div
                style={{ width: `${sleep.remSleepPercent}%` }}
                className="bg-purple-500 border-r border-black"
                title="Sono REM"
              />
              <div
                style={{ width: `${sleep.lightSleepPercent}%` }}
                className="bg-blue-400 border-r border-black"
                title="Sono Leve"
              />
              <div style={{ width: "4%" }} className="bg-zinc-700" title="Despertares" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="bg-[#050505] p-3 border border-zinc-800">
                <span className="text-[9px] font-hud uppercase tracking-wider text-indigo-400 block">
                  PROFUNDO (N3)
                </span>
                <span className="text-white font-bold text-base">
                  {sleep.deepSleepPercent}%
                </span>
                <span className="text-[9px] text-zinc-500 block mt-1">Liberação de GH</span>
              </div>
              <div className="bg-[#050505] p-3 border border-zinc-800">
                <span className="text-[9px] font-hud uppercase tracking-wider text-purple-400 block">
                  REM (SONHOS)
                </span>
                <span className="text-white font-bold text-base">
                  {sleep.remSleepPercent}%
                </span>
                <span className="text-[9px] text-zinc-500 block mt-1">Consolidação neural</span>
              </div>
              <div className="bg-[#050505] p-3 border border-zinc-800">
                <span className="text-[9px] font-hud uppercase tracking-wider text-blue-400 block">
                  LEVE (N1/N2)
                </span>
                <span className="text-white font-bold text-base">
                  {sleep.lightSleepPercent}%
                </span>
                <span className="text-[9px] text-zinc-500 block mt-1">Recuperação física</span>
              </div>
              <div className="bg-[#050505] p-3 border border-zinc-800">
                <span className="text-[9px] font-hud uppercase tracking-wider text-zinc-400 block">
                  DESPERTARES
                </span>
                <span className="text-white font-bold text-base">
                  {sleep.awakeMinutes} MIN
                </span>
                <span className="text-[9px] text-emerald-400 block mt-1">Eficiência</span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-zinc-900 flex items-center gap-2 text-[11px] font-mono text-zinc-500">
          <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span>
            Recovery Status é um indicador analítico derivado de biomarcadores autonômicos e não substitui avaliação clínica médica.
          </span>
        </div>
      </div>

      {/* Log Sleep Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-black border-2 border-zinc-700 max-w-md w-full p-5 space-y-4 hud-corners">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-hud font-bold text-white text-base uppercase">
                REGISTRAR SONO & RECUPERAÇÃO
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
                  <label className="text-zinc-400 block mb-1 uppercase font-hud">
                    HORÁRIO DE DEITAR
                  </label>
                  <input
                    type="time"
                    value={bedTime}
                    onChange={(e) => setBedTime(e.target.value)}
                    className="w-full bg-[#050505] border border-zinc-800 p-2 text-white outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1 uppercase font-hud">
                    HORÁRIO DE ACORDAR
                  </label>
                  <input
                    type="time"
                    value={wakeTime}
                    onChange={(e) => setWakeTime(e.target.value)}
                    className="w-full bg-[#050505] border border-zinc-800 p-2 text-white outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-zinc-400 block mb-1 uppercase font-hud">
                    DURAÇÃO (H)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full bg-[#050505] border border-zinc-800 p-2 text-white font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1 uppercase font-hud">
                    HRV (MS)
                  </label>
                  <input
                    type="number"
                    value={hrv}
                    onChange={(e) => setHrv(e.target.value)}
                    className="w-full bg-[#050505] border border-zinc-800 p-2 text-cyan-400 font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1 uppercase font-hud">
                    FC REPOUSO
                  </label>
                  <input
                    type="number"
                    value={restingHr}
                    onChange={(e) => setRestingHr(e.target.value)}
                    className="w-full bg-[#050505] border border-zinc-800 p-2 text-rose-400 font-bold outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 border border-zinc-800 bg-black text-zinc-400 text-xs font-hud uppercase"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-black font-hud font-bold text-xs uppercase"
                >
                  SALVAR REGISTRO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
