import React, { useState } from "react";
import { X, Download, Share2, Award, AlertCircle, Check } from "lucide-react";

interface MonthlyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MonthlyReportModal: React.FC<MonthlyReportModalProps> = ({ isOpen, onClose }) => {
  const [exported, setExported] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-black border-2 border-zinc-700 max-w-lg w-full p-6 space-y-5 hud-corners shadow-[0_0_40px_rgba(0,0,0,0.9)] relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div>
            <span className="text-[10px] font-dot text-emerald-400 tracking-widest uppercase block mb-1">
              OFFICIAL LABORATORY DOSSIER // SYNTHESIS
            </span>
            <h2 className="font-hud font-bold text-xl text-white tracking-wider">
              06 // MONTHLY REPORT
            </h2>
            <span className="text-xs font-mono text-zinc-400">
              CYCLE 09 // SEPTEMBER 2026 AUDIT
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-black border border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Core Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-mono text-xs">
          <div className="bg-[#050505] border border-zinc-800 p-3">
            <span className="text-[9px] font-hud text-zinc-500 block uppercase tracking-wider">BODY COMP</span>
            <span className="text-xl font-mono font-extrabold text-emerald-400">-3.2 KG</span>
            <span className="text-[9px] text-zinc-400 block mt-1">81.4kg → 78.2kg</span>
          </div>

          <div className="bg-[#050505] border border-zinc-800 p-3">
            <span className="text-[9px] font-hud text-zinc-500 block uppercase tracking-wider">TRAIN SESSIONS</span>
            <span className="text-xl font-mono font-extrabold text-white">18 SES</span>
            <span className="text-[9px] text-zinc-400 block mt-1">+4 PRs batidos</span>
          </div>

          <div className="bg-[#050505] border border-zinc-800 p-3">
            <span className="text-[9px] font-hud text-zinc-500 block uppercase tracking-wider">RUN / CARDIO</span>
            <span className="text-xl font-mono font-extrabold text-cyan-400">34.8 KM</span>
            <span className="text-[9px] text-zinc-400 block mt-1">Pace: 4:52/km</span>
          </div>

          <div className="bg-[#050505] border border-zinc-800 p-3">
            <span className="text-[9px] font-hud text-zinc-500 block uppercase tracking-wider">SLEEP AVG</span>
            <span className="text-xl font-mono font-extrabold text-indigo-400">7H 11M</span>
            <span className="text-[9px] text-zinc-400 block mt-1">HRV méd: 68ms</span>
          </div>

          <div className="bg-[#050505] border border-zinc-800 p-3">
            <span className="text-[9px] font-hud text-zinc-500 block uppercase tracking-wider">NUTRITION</span>
            <span className="text-xl font-mono font-extrabold text-amber-400">82% OK</span>
            <span className="text-[9px] text-zinc-400 block mt-1">172g prot/dia</span>
          </div>

          <div className="bg-[#050505] border border-zinc-800 p-3">
            <span className="text-[9px] font-hud text-zinc-500 block uppercase tracking-wider">CONSISTENCY</span>
            <span className="text-xl font-mono font-extrabold text-emerald-400">91%</span>
            <span className="text-[9px] text-zinc-400 block mt-1">Score global</span>
          </div>
        </div>

        {/* Top Improvement & Attention Section */}
        <div className="space-y-2.5 font-mono text-xs">
          <div className="bg-[#050505] border border-emerald-500/40 p-3 flex items-start gap-2.5">
            <Award className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-hud font-bold text-emerald-400 uppercase tracking-wider block">
                TOP PERFORMANCE // EFICIÊNCIA CARDIOVASCULAR
              </span>
              <p className="text-zinc-300 text-[11px] mt-1 leading-relaxed">
                VO2 máximo estimado progrediu de 49.5 para 52.8 ml/kg/min com frequência cardíaca em limiar caindo 5 bpm.
              </p>
            </div>
          </div>

          <div className="bg-[#050505] border border-amber-500/40 p-3 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-hud font-bold text-amber-400 uppercase tracking-wider block">
                FLAG DE ATENÇÃO // REGULARIDADE DE SONO
              </span>
              <p className="text-zinc-300 text-[11px] mt-1 leading-relaxed">
                Oscilação de 1h 45m no horário de adormecer nos fins de semana impactou o HRV e a recuperação nos dias seguintes.
              </p>
            </div>
          </div>
        </div>

        {exported && (
          <div className="bg-emerald-950/40 border border-emerald-500 p-2.5 text-xs font-mono text-emerald-400 flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>RELATÓRIO MENSAL GERADO E ARMAZENADO NO HEALTH VAULT!</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-3 border-t border-zinc-800 text-xs font-mono gap-2">
          <span className="text-zinc-500 text-[10px] font-mono">
            SYS-HASH: GL-AUDIT-202609-84A
          </span>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={handleExport}
              className="flex-1 sm:flex-initial px-3.5 py-1.5 bg-black hover:bg-zinc-900 border border-zinc-700 hover:border-white text-zinc-200 font-hud text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5" /> [ EXPORTAR DOSSIÊ ]
            </button>
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-black font-hud font-bold text-[11px] uppercase tracking-wider border border-emerald-400 transition-all shadow-[2px_2px_0px_#27272a]"
            >
              [ FECHAR ]
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
