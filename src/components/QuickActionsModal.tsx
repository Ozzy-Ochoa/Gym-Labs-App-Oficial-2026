import React, { useState } from "react";
import { Scale, Utensils, Dumbbell, Droplets, Moon, Smile, X } from "lucide-react";

interface QuickActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogWeight: (weight: number, bodyFat?: number) => void;
  onLogWater: (amountMl: number) => void;
  onLogSleep: (hours: number) => void;
  onLogCheckIn: (mood: number, energy: number, stress: number) => void;
}

export const QuickActionsModal: React.FC<QuickActionsModalProps> = ({
  isOpen,
  onClose,
  onLogWeight,
  onLogWater,
  onLogSleep,
  onLogCheckIn,
}) => {
  const [activeAction, setActiveAction] = useState<
    "weight" | "water" | "sleep" | "checkin" | null
  >("weight");

  // Form states
  const [weightVal, setWeightVal] = useState("78.2");
  const [fatVal, setFatVal] = useState("14.1");
  const [waterCustom, setWaterCustom] = useState("300");
  const [sleepHours, setSleepHours] = useState("7.5");
  const [mood, setMood] = useState(8);
  const [energy, setEnergy] = useState(8);
  const [stress, setStress] = useState(3);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-black border-2 border-zinc-700 max-w-lg w-full p-5 space-y-4 hud-corners shadow-[0_0_30px_rgba(0,0,0,0.9)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div>
            <span className="text-[10px] font-dot text-emerald-400 uppercase tracking-widest block mb-1">
              FAST TELEMETRY CAPTURE // QUICK PROTOCOL
            </span>
            <h3 className="font-hud font-bold text-xl text-white tracking-wider">
              QUICK ACTIONS // ENTRADA RÁPIDA
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-black border border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Selectors (Section 35) */}
        <div className="grid grid-cols-4 gap-2 font-hud text-xs">
          <button
            onClick={() => setActiveAction("weight")}
            className={`p-2.5 border flex flex-col items-center gap-1.5 transition-all ${
              activeAction === "weight"
                ? "bg-emerald-400 text-black font-bold border-emerald-400 shadow-[2px_2px_0px_#27272a]"
                : "bg-black border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>[ PESO ]</span>
          </button>

          <button
            onClick={() => setActiveAction("water")}
            className={`p-2.5 border flex flex-col items-center gap-1.5 transition-all ${
              activeAction === "water"
                ? "bg-cyan-400 text-black font-bold border-cyan-400 shadow-[2px_2px_0px_#27272a]"
                : "bg-black border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
            }`}
          >
            <Droplets className="w-4 h-4" />
            <span>[ ÁGUA ]</span>
          </button>

          <button
            onClick={() => setActiveAction("sleep")}
            className={`p-2.5 border flex flex-col items-center gap-1.5 transition-all ${
              activeAction === "sleep"
                ? "bg-indigo-400 text-black font-bold border-indigo-400 shadow-[2px_2px_0px_#27272a]"
                : "bg-black border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
            }`}
          >
            <Moon className="w-4 h-4" />
            <span>[ SONO ]</span>
          </button>

          <button
            onClick={() => setActiveAction("checkin")}
            className={`p-2.5 border flex flex-col items-center gap-1.5 transition-all ${
              activeAction === "checkin"
                ? "bg-amber-400 text-black font-bold border-amber-400 shadow-[2px_2px_0px_#27272a]"
                : "bg-black border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
            }`}
          >
            <Smile className="w-4 h-4" />
            <span>[ CHECK-IN ]</span>
          </button>
        </div>

        {/* Dynamic Form Content */}
        <div className="bg-[#050505] border border-zinc-800 p-4 font-mono text-xs space-y-4">
          {activeAction === "weight" && (
            <div className="space-y-3">
              <div>
                <label className="text-zinc-400 block mb-1 font-hud uppercase tracking-wider">PESO ATUAL (KG)</label>
                <input
                  type="number"
                  step="0.1"
                  value={weightVal}
                  onChange={(e) => setWeightVal(e.target.value)}
                  className="w-full bg-black border border-zinc-700 p-2.5 text-xl font-bold text-white focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="text-zinc-400 block mb-1 font-hud uppercase tracking-wider">% GORDURA ESTIMADA (OPCIONAL)</label>
                <input
                  type="number"
                  step="0.1"
                  value={fatVal}
                  onChange={(e) => setFatVal(e.target.value)}
                  className="w-full bg-black border border-zinc-700 p-2.5 text-base text-emerald-400 focus:outline-none focus:border-emerald-400"
                />
              </div>
              <button
                onClick={() => {
                  onLogWeight(Number(weightVal), Number(fatVal));
                  onClose();
                }}
                className="w-full py-2.5 bg-emerald-400 hover:bg-emerald-300 text-black font-hud font-bold text-xs uppercase tracking-wider border border-emerald-400 mt-2 shadow-[2px_2px_0px_#27272a]"
              >
                [ CONFIRMAR REGISTRO DE PESO ]
              </button>
            </div>
          )}

          {activeAction === "water" && (
            <div className="space-y-3">
              <label className="text-zinc-400 block font-hud uppercase tracking-wider">CONSUMO DE ÁGUA RÁPIDO</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    onLogWater(250);
                    onClose();
                  }}
                  className="py-3 bg-black border border-zinc-800 hover:border-cyan-400 text-cyan-400 font-bold font-hud uppercase tracking-wider"
                >
                  + 250 ML
                </button>
                <button
                  onClick={() => {
                    onLogWater(500);
                    onClose();
                  }}
                  className="py-3 bg-black border border-zinc-800 hover:border-cyan-400 text-cyan-400 font-bold font-hud uppercase tracking-wider"
                >
                  + 500 ML
                </button>
                <button
                  onClick={() => {
                    onLogWater(1000);
                    onClose();
                  }}
                  className="py-3 bg-black border border-zinc-800 hover:border-cyan-400 text-cyan-400 font-bold font-hud uppercase tracking-wider"
                >
                  + 1000 ML
                </button>
              </div>

              <div className="pt-2">
                <label className="text-zinc-500 block mb-1 font-hud uppercase tracking-wider">VALOR CUSTOMIZADO (ML)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={waterCustom}
                    onChange={(e) => setWaterCustom(e.target.value)}
                    className="flex-1 bg-black border border-zinc-700 p-2 text-white font-bold"
                  />
                  <button
                    onClick={() => {
                      onLogWater(Number(waterCustom));
                      onClose();
                    }}
                    className="px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-black font-hud font-bold text-xs uppercase tracking-wider border border-cyan-400 shadow-[2px_2px_0px_#27272a]"
                  >
                    [ REGISTRAR ]
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeAction === "sleep" && (
            <div className="space-y-3">
              <div>
                <label className="text-zinc-400 block mb-1 font-hud uppercase tracking-wider">HORAS DE SONO REGISTRADAS</label>
                <input
                  type="number"
                  step="0.1"
                  value={sleepHours}
                  onChange={(e) => setSleepHours(e.target.value)}
                  className="w-full bg-black border border-zinc-700 p-2.5 text-xl font-bold text-white focus:outline-none focus:border-indigo-400"
                />
              </div>
              <button
                onClick={() => {
                  onLogSleep(Number(sleepHours));
                  onClose();
                }}
                className="w-full py-2.5 bg-indigo-400 hover:bg-indigo-300 text-black font-hud font-bold text-xs uppercase tracking-wider border border-indigo-400 mt-2 shadow-[2px_2px_0px_#27272a]"
              >
                [ REGISTRAR SESSÃO DE SONO ]
              </button>
            </div>
          )}

          {activeAction === "checkin" && (
            <div className="space-y-3">
              <span className="text-zinc-400 block font-hud uppercase tracking-wider">
                MIND LAB // ESCALA SUBJETIVA (1 - 10)
              </span>

              <div>
                <div className="flex justify-between text-zinc-400 mb-1 font-hud uppercase tracking-wider">
                  <span>DISPOSIÇÃO / ENERGIA:</span>
                  <span className="text-emerald-400 font-bold font-mono">{energy}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={energy}
                  onChange={(e) => setEnergy(Number(e.target.value))}
                  className="w-full accent-emerald-400 h-1 bg-zinc-800 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-zinc-400 mb-1 font-hud uppercase tracking-wider">
                  <span>HUMOR / FOCO MENTAL:</span>
                  <span className="text-cyan-400 font-bold font-mono">{mood}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={mood}
                  onChange={(e) => setMood(Number(e.target.value))}
                  className="w-full accent-cyan-400 h-1 bg-zinc-800 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-zinc-400 mb-1 font-hud uppercase tracking-wider">
                  <span>NÍVEL DE ESTRESSE:</span>
                  <span className="text-amber-400 font-bold font-mono">{stress}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={stress}
                  onChange={(e) => setStress(Number(e.target.value))}
                  className="w-full accent-amber-400 h-1 bg-zinc-800 cursor-pointer"
                />
              </div>

              <button
                onClick={() => {
                  onLogCheckIn(mood, energy, stress);
                  onClose();
                }}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-hud font-bold text-xs uppercase tracking-wider border border-amber-400 mt-2 shadow-[2px_2px_0px_#27272a]"
              >
                [ SALVAR CHECK-IN DIÁRIO ]
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
