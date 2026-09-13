import React from "react";
import { SystemStatusScores } from "../types";
import { ShieldCheck, Info } from "lucide-react";

interface SystemStatusCardProps {
  scores: SystemStatusScores;
}

export const SystemStatusCard: React.FC<SystemStatusCardProps> = ({ scores }) => {
  const metrics = [
    { label: "TRAINING", code: "TRN", value: scores.training, weight: "25%" },
    { label: "NUTRITION", code: "NUT", value: scores.nutrition, weight: "20%" },
    { label: "SLEEP", code: "SLP", value: scores.sleep, weight: "20%" },
    { label: "RECOVERY", code: "REC", value: scores.recovery, weight: "15%" },
    { label: "ACTIVITY", code: "ACT", value: scores.activity, weight: "10%" },
    { label: "CONSISTENCY", code: "CNS", value: scores.consistency, weight: "10%" },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-white";
    if (score >= 75) return "text-zinc-200";
    if (score >= 60) return "text-zinc-300";
    return "text-zinc-400";
  };

  const getBarColor = (score: number) => {
    if (score >= 85) return "bg-white";
    if (score >= 75) return "bg-zinc-300";
    if (score >= 60) return "bg-zinc-400";
    return "bg-zinc-600";
  };

  return (
    <div className="bg-black border border-zinc-800 p-4 sm:p-5 relative hud-corners">
      {/* HUD Telemetry Top Bar */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2 mb-3 text-[10px] text-zinc-500">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
          <span className="uppercase tracking-wider text-zinc-400">TELEMETRIA // ÍNDICE GERAL</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-zinc-600">SAMPLE: 100Hz</span>
          <span className="text-zinc-300 font-medium">[ATIVO]</span>
        </div>
      </div>

      {/* Hero Index Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
        <div>
          <span className="text-[10px] text-zinc-400 tracking-wider uppercase block mb-1">
            Status do Sistema
          </span>
          <h2 className="font-bold text-2xl sm:text-3xl text-white tracking-tight flex items-center gap-3">
            SYSTEM STATUS
            <span
              className="text-xs px-2 py-0.5 border border-zinc-800 bg-zinc-950 font-mono font-medium tracking-wide text-zinc-300"
            >
              {scores.overall === 0 ? "CALIBRANDO" : `${scores.overall.toFixed(1)}_OTIMIZADO`}
            </span>
          </h2>
        </div>

        <div className="flex items-baseline gap-2 sm:text-right">
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
              {scores.overall}
            </span>
            <span className="font-mono text-sm text-zinc-500">/100</span>
          </div>
          <div className="text-left sm:text-right pl-2 border-l sm:border-l-0 sm:border-r border-zinc-800 pr-2">
            <span
              className="text-[10px] flex items-center gap-1 uppercase tracking-wider text-zinc-400"
            >
              <ShieldCheck className="w-3 h-3 inline text-zinc-300" />{" "}
              {scores.overall === 0 ? "TELEMETRIA: INICIAL" : "MONITORAMENTO ATIVO"}
            </span>
            <span className="text-[9px] font-mono text-zinc-500 block">
              {scores.overall === 0 ? "AGUARDANDO SESSÕES" : "SIGMA: ±0.4 • CI: 95%"}
            </span>
          </div>
        </div>
      </div>

      {/* Sub-indices Grid - Neo Brutalist Functional Blocks */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {metrics.map((item) => (
          <div key={item.label} className="bg-[#050505] border border-zinc-800 p-2.5 relative group hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between text-[10px] font-mono mb-1">
              <span className="text-zinc-500">{item.code}</span>
              <span className="text-zinc-600 text-[9px]">W:{item.weight}</span>
            </div>

            <div className="flex items-baseline justify-between mb-2">
              <span className="text-[10px] font-hud text-zinc-300 font-bold uppercase tracking-wider">
                {item.label}
              </span>
              <span className={`font-mono text-base font-bold ${getScoreColor(item.value)}`}>
                {item.value}
              </span>
            </div>

            {/* Segmented Digital Meter Bar */}
            <div className="w-full h-1.5 bg-zinc-950 border border-zinc-800 flex overflow-hidden">
              <div
                className={`h-full ${getBarColor(item.value)} transition-all duration-300`}
                style={{ width: `${item.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Methodology Disclaimer */}
      <div className="mt-4 pt-2.5 border-t border-zinc-800 flex items-start gap-2 text-[10px] font-mono text-zinc-500 leading-tight">
        <Info className="w-3 h-3 text-zinc-600 mt-0.5 shrink-0" />
        <span>
          Índice interno de acompanhamento ponderado baseado em telemetria contínua. Não constitui diagnóstico clínico ou avaliação médica.
        </span>
      </div>
    </div>
  );
};
