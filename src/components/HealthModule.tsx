import React, { useState } from "react";
import { NutritionLog, MealItem, SleepMetrics, MoodLog } from "../types";
import { NutritionModule } from "./NutritionModule";
import { SleepRecoveryModule } from "./SleepRecoveryModule";
import {
  Utensils,
  Droplets,
  Moon,
  Smile,
  Plus,
  Check,
  TrendingUp,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  Zap,
  Activity,
  AlertCircle,
} from "lucide-react";

interface HealthModuleProps {
  nutrition: NutritionLog;
  sleep: SleepMetrics;
  moodLogs: MoodLog[];
  onAddWater: (amountMl: number) => void;
  onAddMeal: (meal: MealItem) => void;
  onRemoveMeal: (mealId: string) => void;
  onUpdateNutritionGoals: (goals: {
    caloriesTarget: number;
    proteinTargetG: number;
    carbsTargetG: number;
    fatTargetG: number;
    waterTargetMl: number;
  }) => void;
  onOpenAssessment: () => void;
  onUpdateSleep: (sleep: SleepMetrics) => void;
  onLogMood: (entry: MoodLog) => void;
  defaultSubTab?: "nutricao" | "hidratacao" | "sono" | "humor";
  userWeightKg?: number;
}

export const HealthModule: React.FC<HealthModuleProps> = ({
  nutrition,
  sleep,
  moodLogs,
  onAddWater,
  onAddMeal,
  onRemoveMeal,
  onUpdateNutritionGoals,
  onOpenAssessment,
  onUpdateSleep,
  onLogMood,
  defaultSubTab = "nutricao",
  userWeightKg = 75,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"nutricao" | "hidratacao" | "sono" | "humor">(
    defaultSubTab
  );

  // Hydration state
  const [customWaterMl, setCustomWaterMl] = useState("");
  const [showEditWaterGoal, setShowEditWaterGoal] = useState(false);
  const [targetWaterInput, setTargetWaterInput] = useState(nutrition.waterTargetMl.toString());

  // Mood & Readiness state
  const [selectedMood, setSelectedMood] = useState<MoodLog["mood"]>("GOOD");
  const [energyLevel, setEnergyLevel] = useState(7);
  const [stressLevel, setStressLevel] = useState(3);
  const [mentalFocus, setMentalFocus] = useState(8);
  const [moodNotes, setMoodNotes] = useState("");
  const [checkInSaved, setCheckInSaved] = useState(false);

  // Calculate calculated readiness index (0-100)
  const calculateReadiness = (energy: number, stress: number, sleepScore: number) => {
    const energyContribution = energy * 5; // max 50
    const sleepContribution = (sleepScore / 100) * 40; // max 40
    const stressPenalty = Math.max(0, (stress - 3) * 3); // 0 to 21 penalty
    return Math.min(100, Math.max(10, Math.round(energyContribution + sleepContribution - stressPenalty + 10)));
  };

  const currentReadiness = calculateReadiness(energyLevel, stressLevel, sleep.recoveryScore || 75);

  const handleSaveCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    const entry: MoodLog = {
      id: "mood_" + Date.now(),
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      mood: selectedMood,
      energyLevel,
      stressLevel,
      mentalFocus,
      notes: moodNotes.trim() || undefined,
      readinessScore: currentReadiness,
    };
    onLogMood(entry);
    setCheckInSaved(true);
    setTimeout(() => setCheckInSaved(false), 3000);
  };

  const handleSaveWaterTarget = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(targetWaterInput);
    if (val > 500 && val < 10000) {
      onUpdateNutritionGoals({
        caloriesTarget: nutrition.caloriesTarget,
        proteinTargetG: nutrition.proteinTargetG,
        carbsTargetG: nutrition.carbsTargetG,
        fatTargetG: nutrition.fatTargetG,
        waterTargetMl: val,
      });
      setShowEditWaterGoal(false);
    }
  };

  const recommendedWater = Math.round(userWeightKg * 35); // 35 ml per kg
  const waterProgressPercent = Math.min(
    100,
    Math.round((nutrition.waterCurrentMl / (nutrition.waterTargetMl || 3000)) * 100)
  );

  return (
    <div className="space-y-6">
      {/* Top Header of Saúde */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800 pb-3 gap-3">
        <div>
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block mb-1">
            SAÚDE INTEGRADA // NUTRIÇÃO, ÁGUA, SONO & BEM-ESTAR
          </span>
          <h2 className="font-hud font-bold text-2xl text-white tracking-wider flex items-center gap-3">
            03 // CENTRAL DE SAÚDE
          </h2>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-1 bg-black border border-zinc-800 p-1 text-xs font-hud overflow-x-auto">
          <button
            onClick={() => setActiveSubTab("nutricao")}
            className={`px-3 py-1.5 uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === "nutricao"
                ? "bg-white text-black font-bold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>NUTRIÇÃO</span>
          </button>
          <button
            onClick={() => setActiveSubTab("hidratacao")}
            className={`px-3 py-1.5 uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === "hidratacao"
                ? "bg-white text-black font-bold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>HIDRATAÇÃO</span>
          </button>
          <button
            onClick={() => setActiveSubTab("sono")}
            className={`px-3 py-1.5 uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === "sono"
                ? "bg-white text-black font-bold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>SONO</span>
          </button>
          <button
            onClick={() => setActiveSubTab("humor")}
            className={`px-3 py-1.5 uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === "humor"
                ? "bg-white text-black font-bold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Smile className="w-3.5 h-3.5" />
            <span>HUMOR & PRONTIDÃO</span>
          </button>
        </div>
      </div>

      {/* Sub-tab 01: NUTRIÇÃO */}
      {activeSubTab === "nutricao" && (
        <NutritionModule
          nutrition={nutrition}
          onAddWater={onAddWater}
          onAddMeal={onAddMeal}
          onRemoveMeal={onRemoveMeal}
          onOpenAssessment={onOpenAssessment}
          onUpdateNutritionGoals={onUpdateNutritionGoals}
        />
      )}

      {/* Sub-tab 02: HIDRATAÇÃO */}
      {activeSubTab === "hidratacao" && (
        <div className="space-y-6">
          {/* Hero Hydration Block */}
          <div className="bg-black border border-zinc-800 p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
              <div>
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block mb-1">
                  BALANÇO HÍDRICO DIÁRIO
                </span>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl sm:text-5xl font-extrabold font-mono text-white tracking-tight">
                    {nutrition.waterCurrentMl}
                  </span>
                  <span className="text-zinc-500 font-mono text-lg">
                    / {nutrition.waterTargetMl} ML
                  </span>
                  <span className="text-sm font-mono font-bold px-2 py-0.5 border border-zinc-700 bg-zinc-900 text-white">
                    {waterProgressPercent}%
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowEditWaterGoal(!showEditWaterGoal)}
                className="px-3 py-1.5 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 text-xs font-mono flex items-center gap-2"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{showEditWaterGoal ? "FECHAR META" : "AJUSTAR META DIÁRIA"}</span>
              </button>
            </div>

            {/* Target Editor Drawer */}
            {showEditWaterGoal && (
              <form onSubmit={handleSaveWaterTarget} className="bg-zinc-950 border border-zinc-800 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-zinc-300 font-bold uppercase">
                    DEFINIR META DE HIDRATAÇÃO (ML)
                  </span>
                  <span className="text-[11px] font-mono text-zinc-500">
                    Recomendado: ~{recommendedWater} ml ({userWeightKg}kg × 35ml)
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={targetWaterInput}
                    onChange={(e) => setTargetWaterInput(e.target.value)}
                    min="1000"
                    max="8000"
                    step="100"
                    className="flex-1 bg-black border border-zinc-700 p-2 text-white font-mono text-sm focus:border-white focus:outline-none"
                    placeholder="Ex: 3000"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-white text-black font-mono font-bold text-xs hover:bg-zinc-200"
                  >
                    SALVAR META
                  </button>
                </div>
              </form>
            )}

            {/* Visual Progress Bar */}
            <div className="space-y-2">
              <div className="w-full bg-zinc-900 h-3 border border-zinc-800 overflow-hidden">
                <div
                  className="bg-white h-full transition-all duration-300"
                  style={{ width: `${waterProgressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-mono text-zinc-500">
                <span>0 ML</span>
                <span>METADE: {Math.round(nutrition.waterTargetMl / 2)} ML</span>
                <span>OBJETIVO: {nutrition.waterTargetMl} ML</span>
              </div>
            </div>

            {/* Quick Logging Buttons */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
                REGISTRO RÁPIDO DE INGESTÃO
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => onAddWater(200)}
                  className="p-3 bg-black border border-zinc-800 hover:border-zinc-500 text-left transition-all group"
                >
                  <div className="flex items-center justify-between text-zinc-400 group-hover:text-white mb-1">
                    <span className="text-xs font-mono font-bold">+200 ML</span>
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono block">Copo pequeno</span>
                </button>

                <button
                  onClick={() => onAddWater(350)}
                  className="p-3 bg-black border border-zinc-800 hover:border-zinc-500 text-left transition-all group"
                >
                  <div className="flex items-center justify-between text-zinc-400 group-hover:text-white mb-1">
                    <span className="text-xs font-mono font-bold">+350 ML</span>
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono block">Copo padrão</span>
                </button>

                <button
                  onClick={() => onAddWater(500)}
                  className="p-3 bg-black border border-zinc-800 hover:border-zinc-500 text-left transition-all group"
                >
                  <div className="flex items-center justify-between text-zinc-400 group-hover:text-white mb-1">
                    <span className="text-xs font-mono font-bold">+500 ML</span>
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono block">Garrafa squeeze</span>
                </button>

                <button
                  onClick={() => onAddWater(1000)}
                  className="p-3 bg-black border border-zinc-800 hover:border-zinc-500 text-left transition-all group"
                >
                  <div className="flex items-center justify-between text-zinc-400 group-hover:text-white mb-1">
                    <span className="text-xs font-mono font-bold">+1000 ML</span>
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono block">Garrafa de 1L</span>
                </button>
              </div>
            </div>

            {/* Custom Amount Form */}
            <div className="flex gap-2 pt-2 border-t border-zinc-900">
              <input
                type="number"
                placeholder="Adicionar quantidade customizada (ml)..."
                value={customWaterMl}
                onChange={(e) => setCustomWaterMl(e.target.value)}
                min="50"
                max="3000"
                step="50"
                className="flex-1 bg-black border border-zinc-800 px-3 py-2 text-xs font-mono text-white focus:border-zinc-500 focus:outline-none"
              />
              <button
                onClick={() => {
                  const val = Number(customWaterMl);
                  if (val > 0) {
                    onAddWater(val);
                    setCustomWaterMl("");
                  }
                }}
                disabled={!customWaterMl || Number(customWaterMl) <= 0}
                className="px-4 py-2 bg-white text-black font-mono font-bold text-xs hover:bg-zinc-200 disabled:opacity-30"
              >
                + ADICIONAR
              </button>
            </div>
          </div>

          {/* Hydration Guidance Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono">
            <div className="bg-black border border-zinc-800 p-4 space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase">Cálculo Clínico Basal</span>
              <span className="text-base font-bold text-white block">35 ml/kg/dia</span>
              <p className="text-[11px] text-zinc-400">
                Para seu peso ({userWeightKg}kg), a necessidade biológica mínima é de{" "}
                <span className="text-white font-bold">{recommendedWater} ml</span>.
              </p>
            </div>

            <div className="bg-black border border-zinc-800 p-4 space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase">Ajuste de Treino</span>
              <span className="text-base font-bold text-white block">+500 a 750 ml</span>
              <p className="text-[11px] text-zinc-400">
                Compensação de suor e taxa de transpiração para cada 60 min de esforço vigoroso.
              </p>
            </div>

            <div className="bg-black border border-zinc-800 p-4 space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase">Distribuição Ideal</span>
              <span className="text-base font-bold text-white block">Fracionado</span>
              <p className="text-[11px] text-zinc-400">
                Beba 250-400ml a cada 2 horas ao invés de grandes volumes espaçados.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab 03: SONO */}
      {activeSubTab === "sono" && (
        <SleepRecoveryModule sleep={sleep} onUpdateSleep={onUpdateSleep} />
      )}

      {/* Sub-tab 04: HUMOR & PRONTIDÃO */}
      {activeSubTab === "humor" && (
        <div className="space-y-6">
          {/* Hero Readiness Card */}
          <div className="bg-black border border-zinc-800 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
              <div>
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block mb-1">
                  ÍNDICE DE PRONTIDÃO BIOLÓGICA (READINESS)
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-extrabold font-mono text-white tracking-tight">
                    {currentReadiness}
                  </span>
                  <span className="text-sm font-mono text-zinc-500">/ 100 PTS</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-mono text-zinc-400 uppercase block mb-1">STATUS DE PRONTIDÃO</span>
                <span className="text-xs font-mono font-bold px-2.5 py-1 border border-zinc-700 bg-zinc-950 text-white inline-block">
                  {currentReadiness >= 75
                    ? "ALTA // APTO PARA CARGA MÁXIMA"
                    : currentReadiness >= 50
                    ? "MODERADA // TREINO CONTROLADO"
                    : "BAIXA // PRIORIZAR RECUPERAÇÃO"}
                </span>
              </div>
            </div>

            <p className="text-xs font-mono text-zinc-400 leading-relaxed">
              {currentReadiness >= 75
                ? "Seus marcadores de sono, energia e estresse indicam prontidão excelente. Momento ideal para progressão de carga, sprints ou sessões com alto volume."
                : currentReadiness >= 50
                ? "Prontidão equilibrada. Mantenha os pesos planejados, respeitando o descanso entre as séries."
                : "Sistema em estado de fadiga acumulada ou sono insuficiente. Recomendada redução de volume, foco em mobilidade ou descanso ativo."}
            </p>
          </div>

          {/* Daily Check-in Form */}
          <form onSubmit={handleSaveCheckIn} className="bg-black border border-zinc-800 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block mb-1">
                  CHECK-IN PSICOFISIOLÓGICO DO DIA
                </span>
                <h3 className="text-base font-hud font-bold text-white tracking-wider">
                  REGISTRAR ESTADO ATUAL
                </h3>
              </div>
              <span className="text-xs font-mono text-zinc-500">
                {new Date().toLocaleDateString("pt-BR")}
              </span>
            </div>

            {/* Mood selector buttons */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
                1. COMO VOCÊ ESTÁ SE SENTINDO HOJE?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-xs">
                {(
                  [
                    { key: "EXCELLENT", label: "EXCELENTE", desc: "Revigorado" },
                    { key: "GOOD", label: "BOM", desc: "Disposto" },
                    { key: "NEUTRAL", label: "NEUTRO", desc: "Estável" },
                    { key: "TIRED", label: "CANSADO", desc: "Fadiga" },
                    { key: "STRESSED", label: "ESTRESSADO", desc: "Tensão" },
                  ] as const
                ).map((m) => {
                  const isSelected = selectedMood === m.key;
                  return (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setSelectedMood(m.key)}
                      className={`p-3 border text-left transition-all ${
                        isSelected
                          ? "bg-white text-black border-white font-bold"
                          : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                      }`}
                    >
                      <span className="block font-bold">{m.label}</span>
                      <span className={`text-[10px] block ${isSelected ? "text-zinc-700" : "text-zinc-500"}`}>
                        {m.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Energy Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-400 uppercase">2. NÍVEL DE ENERGIA VITAL</span>
                <span className="text-white font-bold">{energyLevel} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={energyLevel}
                onChange={(e) => setEnergyLevel(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 accent-white cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-zinc-600">
                <span>1 - Exaustão total</span>
                <span>5 - Moderada</span>
                <span>10 - Pico de energia</span>
              </div>
            </div>

            {/* Stress Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-400 uppercase">3. NÍVEL DE ESTRESSE / TENSÃO</span>
                <span className="text-white font-bold">{stressLevel} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={stressLevel}
                onChange={(e) => setStressLevel(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 accent-white cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-zinc-600">
                <span>1 - Relaxado / Zen</span>
                <span>5 - Administrável</span>
                <span>10 - Alta sobrecarga</span>
              </div>
            </div>

            {/* Mental Focus Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-400 uppercase">4. FOCO MENTAL & CONCENTRAÇÃO</span>
                <span className="text-white font-bold">{mentalFocus} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={mentalFocus}
                onChange={(e) => setMentalFocus(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 accent-white cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-zinc-600">
                <span>1 - Disperso</span>
                <span>5 - Adequado</span>
                <span>10 - Hiperfoco</span>
              </div>
            </div>

            {/* Notes textarea */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
                5. NOTAS SUBJETIVAS (OPCIONAL)
              </label>
              <textarea
                value={moodNotes}
                onChange={(e) => setMoodNotes(e.target.value)}
                placeholder="Ex: Boa noite de sono, sem dores articulares. Pronto para o treino de pernas."
                rows={2}
                className="w-full bg-black border border-zinc-800 p-2.5 text-xs font-mono text-white placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
              />
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-2">
              {checkInSaved ? (
                <span className="text-xs font-mono text-white flex items-center gap-1.5">
                  <Check className="w-4 h-4" /> CHECK-IN REGISTRADO COM SUCESSO!
                </span>
              ) : (
                <span className="text-[11px] font-mono text-zinc-500">
                  Prontidão calculada: {currentReadiness} pts
                </span>
              )}
              <button
                type="submit"
                className="px-5 py-2.5 bg-white text-black font-mono font-bold text-xs uppercase tracking-wider hover:bg-zinc-200 transition-all"
              >
                SALVAR CHECK-IN DIÁRIO
              </button>
            </div>
          </form>

          {/* Past Mood Check-ins */}
          {moodLogs.length > 0 && (
            <div className="bg-black border border-zinc-800 p-5 space-y-3">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
                HISTÓRICO RECENTE DE CHECK-INS
              </span>
              <div className="space-y-2">
                {moodLogs.slice(0, 5).map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-700 text-white font-bold">
                        {log.mood}
                      </span>
                      <span className="text-zinc-400">
                        {log.date} às {log.time}
                      </span>
                      {log.notes && (
                        <span className="text-zinc-500 italic max-w-xs truncate">
                          "{log.notes}"
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-zinc-400">
                      <span>Energia: {log.energyLevel}/10</span>
                      <span>Estresse: {log.stressLevel}/10</span>
                      <span className="text-white font-bold">
                        Prontidão: {log.readinessScore || 70}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
