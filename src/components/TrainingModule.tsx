import React, { useState, useEffect } from "react";
import {
  WorkoutSession,
  CardioSession,
  UserWorkoutRoutine,
  RoutineScaleType,
} from "../types";
import {
  INITIAL_DEFAULT_ROUTINES,
  SCALE_OPTIONS,
  SCALE_SLOTS_MAP,
} from "../data/defaultRoutines";
import { RoutineBuilderModal } from "./training/RoutineBuilderModal";
import { LiveWorkoutTracker } from "./training/LiveWorkoutTracker";
import { TrainingAnalytics } from "./training/TrainingAnalytics";
import {
  Dumbbell,
  Play,
  Edit3,
  Plus,
  Trash2,
  Copy,
  RotateCcw,
  Sparkles,
  BarChart2,
  Calendar,
  Layers,
  Activity,
  CheckCircle2,
  Flame,
  ArrowRight,
} from "lucide-react";

interface TrainingModuleProps {
  workouts: WorkoutSession[];
  cardioSessions: CardioSession[];
  onAddWorkout?: (workout: WorkoutSession) => void;
  onAddCardio?: (cardio: CardioSession) => void;
  onOpenAssessment?: () => void;
  userWeightKg?: number;
}

export const TrainingModule: React.FC<TrainingModuleProps> = ({
  workouts,
  cardioSessions,
  onAddWorkout,
  onAddCardio,
  onOpenAssessment,
  userWeightKg = 75,
}) => {
  const [activeTab, setActiveTab] = useState<"routines" | "analytics" | "cardio">("routines");

  // Routine Scale Configuration (letters: A,B,C... | weekdays: Seg, Ter... | days: Dia 1, 2...)
  const [scaleType, setScaleType] = useState<RoutineScaleType>(() => {
    try {
      const stored = localStorage.getItem("gymlabs_scale_type");
      if (stored === "letters" || stored === "weekdays" || stored === "days") {
        return stored;
      }
    } catch {}
    return "letters";
  });

  // User Workout Routines State
  const [routines, setRoutines] = useState<UserWorkoutRoutine[]>(() => {
    try {
      const stored = localStorage.getItem("gymlabs_user_custom_routines");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_DEFAULT_ROUTINES;
  });

  // Selected filter slot for quick view
  const [selectedSlotFilter, setSelectedSlotFilter] = useState<string>("ALL");

  // Routine Builder Modal State
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<UserWorkoutRoutine | null>(null);

  // Active Live Workout State
  const [activeLiveRoutine, setActiveLiveRoutine] = useState<UserWorkoutRoutine | null>(null);

  // Cardio Form State
  const [cardioSport, setCardioSport] = useState<"Running" | "Cycling" | "Swimming" | "HIIT">("Running");
  const [cardioKm, setCardioKm] = useState<number>(5.0);
  const [cardioMin, setCardioMin] = useState<number>(30);

  // Persistence
  useEffect(() => {
    try {
      localStorage.setItem("gymlabs_scale_type", scaleType);
    } catch {}
  }, [scaleType]);

  useEffect(() => {
    try {
      localStorage.setItem("gymlabs_user_custom_routines", JSON.stringify(routines));
    } catch {}
  }, [routines]);

  // Handle scale change and slot adaptation
  const handleScaleTypeChange = (newScale: RoutineScaleType) => {
    setScaleType(newScale);
    setSelectedSlotFilter("ALL");

    // Automatically adapt routine slot tags to match the new scale format
    const slots = SCALE_SLOTS_MAP[newScale];
    setRoutines((prev) =>
      prev.map((r, idx) => ({
        ...r,
        scaleType: newScale,
        scaleSlot: slots[idx % slots.length] || `Treino ${idx + 1}`,
      }))
    );
  };

  // Routine Management Handlers
  const handleSaveRoutine = (saved: UserWorkoutRoutine) => {
    setRoutines((prev) => {
      const existsIndex = prev.findIndex((r) => r.id === saved.id);
      if (existsIndex >= 0) {
        const updated = [...prev];
        updated[existsIndex] = saved;
        return updated;
      }
      return [saved, ...prev];
    });
    setEditingRoutine(null);
  };

  const handleDeleteRoutine = (id: string, name: string) => {
    if (confirm(`Deseja realmente excluir a ficha de treino "${name}"?`)) {
      setRoutines((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const handleDuplicateRoutine = (routine: UserWorkoutRoutine) => {
    const slots = SCALE_SLOTS_MAP[scaleType];
    const newSlot = slots[routines.length % slots.length] || `Treino ${routines.length + 1}`;
    const clone: UserWorkoutRoutine = {
      ...routine,
      id: `routine_${Date.now()}`,
      name: `${routine.name} (Cópia)`,
      scaleSlot: newSlot,
      isSuggested: false,
    };
    setRoutines((prev) => [...prev, clone]);
  };

  const handleRestoreSuggestedRoutines = () => {
    if (confirm("Deseja restaurar as fichas sugeridas pelo motor biomecânico do Gym Labs?")) {
      setRoutines(INITIAL_DEFAULT_ROUTINES);
      setScaleType("letters");
      setSelectedSlotFilter("ALL");
    }
  };

  // Live Workout Execution
  const handleStartWorkout = (routine: UserWorkoutRoutine) => {
    setActiveLiveRoutine(routine);
  };

  const handleFinishLiveWorkout = (session: WorkoutSession) => {
    if (onAddWorkout) {
      onAddWorkout(session);
    }
    setActiveLiveRoutine(null);
    setActiveTab("analytics"); // Take operator directly to performance analytics
  };

  const handleCancelLiveWorkout = () => {
    setActiveLiveRoutine(null);
  };

  // Cardio Logger
  const handleLogCardioSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddCardio || cardioKm <= 0 || cardioMin <= 0) return;

    const paceMin = cardioMin / cardioKm;
    const pMinutes = Math.floor(paceMin);
    const pSeconds = Math.round((paceMin - pMinutes) * 60);
    const avgPaceStr = `${pMinutes}:${pSeconds.toString().padStart(2, "0")}`;

    const session: CardioSession = {
      id: `cardio_${Date.now()}`,
      sport: cardioSport,
      date: new Date().toISOString().split("T")[0],
      durationMinutes: cardioMin,
      distanceKm: cardioKm,
      avgHeartRate: 145,
      avgPace: avgPaceStr,
      cadence: 160,
      elevationMeters: 20,
      caloriesBurned: Math.round(cardioKm * 65),
      hrZones: {
        zone1: 15,
        zone2: 55,
        zone3: 20,
        zone4: 10,
        zone5: 0,
      },
    };

    onAddCardio(session);
    alert(`Sessão aeróbica registrada: ${cardioSport} (${cardioKm}km em ${cardioMin}min)`);
  };

  // If live workout is currently ongoing, render the LiveWorkoutTracker interface exclusively
  if (activeLiveRoutine) {
    return (
      <LiveWorkoutTracker
        routine={activeLiveRoutine}
        onFinishWorkout={handleFinishLiveWorkout}
        onCancelWorkout={handleCancelLiveWorkout}
        userWeightKg={userWeightKg}
      />
    );
  }

  // Filtered routines by slot
  const filteredRoutines =
    selectedSlotFilter === "ALL"
      ? routines
      : routines.filter((r) => r.scaleSlot === selectedSlotFilter);

  const availableSlots = SCALE_SLOTS_MAP[scaleType] || SCALE_SLOTS_MAP.letters;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800 pb-4 gap-3">
        <div>
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">
            GYM LABS // SISTEMA DE TREINAMENTO INTELIGENTE
          </span>
          <h2 className="font-hud font-bold text-xl sm:text-2xl text-white tracking-wider">
            LABORATÓRIO DE TREINOS & ROTINAS
          </h2>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-1 border border-zinc-800 bg-black p-1">
          <button
            type="button"
            onClick={() => setActiveTab("routines")}
            className={`px-3 py-1.5 text-xs font-hud tracking-wider uppercase transition-all flex items-center gap-1.5 ${
              activeTab === "routines"
                ? "bg-white text-black font-bold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Dumbbell className="w-3.5 h-3.5" />
            <span>FICHAS & ESCALA</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("analytics")}
            className={`px-3 py-1.5 text-xs font-hud tracking-wider uppercase transition-all flex items-center gap-1.5 ${
              activeTab === "analytics"
                ? "bg-white text-black font-bold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>ANALÍTICAS ({workouts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("cardio")}
            className={`px-3 py-1.5 text-xs font-hud tracking-wider uppercase transition-all flex items-center gap-1.5 ${
              activeTab === "cardio"
                ? "bg-white text-black font-bold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>CARDIO & AERÓBICO</span>
          </button>
        </div>
      </div>

      {/* TAB 1: ROUTINES & SCALE MANAGEMENT */}
      {activeTab === "routines" && (
        <div className="space-y-5 animate-fadeIn">
          {/* Scale Selector Banner & Actions */}
          <div className="border border-zinc-800 bg-black p-4 space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">
                  ORGANIZAÇÃO DA ROTINA SEMANAL
                </span>
                <h3 className="text-sm font-hud font-bold text-white tracking-wide">
                  FORMATO DA ESCALA DE TREINO
                </h3>
              </div>

              {/* Scale Options Picker */}
              <div className="flex flex-wrap items-center gap-2">
                {SCALE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleScaleTypeChange(opt.id)}
                    className={`px-3 py-1.5 text-xs font-mono transition-all border ${
                      scaleType === opt.id
                        ? "bg-white text-black border-white font-bold"
                        : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-white"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Slot Filter & New Routine CTAs */}
            <div className="pt-3 border-t border-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs font-mono">
                <span className="text-[10px] text-zinc-500 uppercase mr-1">Filtrar:</span>
                <button
                  type="button"
                  onClick={() => setSelectedSlotFilter("ALL")}
                  className={`px-2.5 py-1 text-xs uppercase ${
                    selectedSlotFilter === "ALL"
                      ? "bg-zinc-800 text-white font-bold"
                      : "bg-black text-zinc-500 hover:text-white border border-zinc-800"
                  }`}
                >
                  TODOS ({routines.length})
                </button>

                {availableSlots.map((slot) => {
                  const hasRoutine = routines.some((r) => r.scaleSlot === slot);
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlotFilter(slot)}
                      className={`px-2.5 py-1 text-xs whitespace-nowrap uppercase transition-colors ${
                        selectedSlotFilter === slot
                          ? "bg-zinc-800 text-white font-bold"
                          : hasRoutine
                          ? "bg-black text-zinc-300 hover:text-white border border-zinc-700"
                          : "bg-black text-zinc-600 border border-zinc-900"
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleRestoreSuggestedRoutines}
                  className="px-2.5 py-1.5 border border-zinc-800 text-zinc-500 hover:text-white text-xs font-mono uppercase flex items-center gap-1 transition-colors"
                  title="Restaurar sugestão padrão"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">RESTAURAR SUGESTÃO</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingRoutine(null);
                    setIsBuilderOpen(true);
                  }}
                  className="px-4 py-1.5 bg-white text-black hover:bg-zinc-200 text-xs font-hud font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ NOVA FICHA</span>
                </button>
              </div>
            </div>
          </div>

          {/* Routines Grid */}
          {filteredRoutines.length === 0 ? (
            <div className="border border-dashed border-zinc-800 bg-black/40 p-10 text-center space-y-3">
              <Dumbbell className="w-8 h-8 text-zinc-600 mx-auto" />
              <h4 className="text-sm font-hud font-bold text-zinc-400 uppercase">
                NENHUMA FICHA ATRIBUÍDA A ESTE SLOT
              </h4>
              <p className="text-xs font-mono text-zinc-500 max-w-sm mx-auto">
                Crie um treino para esta posição da escala ou visualize todas as fichas disponíveis.
              </p>
              <button
                type="button"
                onClick={() => {
                  setEditingRoutine(null);
                  setIsBuilderOpen(true);
                }}
                className="px-4 py-2 bg-white text-black font-hud font-bold text-xs uppercase tracking-wider"
              >
                + MONTAR FICHA AGORA
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredRoutines.map((routine) => {
                const totalSets = routine.exercises.reduce(
                  (sum, e) => sum + (Number(e.sets) || 0),
                  0
                );

                return (
                  <div
                    key={routine.id}
                    className="border border-zinc-800 bg-black p-4 sm:p-5 flex flex-col justify-between gap-4 hover:border-zinc-700 transition-colors shadow-lg relative group"
                  >
                    {/* Top Row: Slot Tag, Name & Badges */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 border border-zinc-700 bg-zinc-900 text-white text-[11px] font-mono font-bold uppercase">
                            {routine.scaleSlot}
                          </span>
                          {routine.isSuggested && (
                            <span className="px-1.5 py-0.5 border border-zinc-800 bg-black text-zinc-400 text-[9px] font-mono flex items-center gap-1 uppercase">
                              <Sparkles className="w-3 h-3 text-amber-400" />
                              SUGERIDO PELO SISTEMA
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] font-mono text-zinc-500 uppercase">
                          ~{routine.estimatedMinutes} MIN • {totalSets} SÉRIES • ~{routine.estimatedCaloriesBurned || Math.round(routine.estimatedMinutes * 6.5 + totalSets * 4.5)} KCAL
                        </span>
                      </div>

                      <h3 className="font-hud font-bold text-base sm:text-lg text-white tracking-wide">
                        {routine.name}
                      </h3>

                      <p className="text-xs font-mono text-zinc-400">
                        {routine.focus || "Hipertrofia e força muscular"}
                      </p>
                    </div>

                    {/* Exercise Breakdown Preview */}
                    <div className="border-t border-b border-zinc-900 py-3 space-y-1.5">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">
                        EXERCÍCIOS ({routine.exercises.length}):
                      </span>
                      <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                        {routine.exercises.map((ex, exIdx) => (
                          <div
                            key={ex.id || exIdx}
                            className="flex items-center justify-between text-xs font-mono text-zinc-300 py-0.5"
                          >
                            <span className="truncate pr-2">
                              {exIdx + 1}. {ex.name}
                            </span>
                            <span className="text-zinc-500 text-[11px] shrink-0">
                              {ex.sets}x {ex.reps} ({ex.suggestedWeightKg}kg)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Routine Actions */}
                    <div className="flex items-center justify-between pt-1 gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingRoutine(routine);
                            setIsBuilderOpen(true);
                          }}
                          className="p-2 border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white transition-colors"
                          title="Editar ficha"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDuplicateRoutine(routine)}
                          className="p-2 border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white transition-colors"
                          title="Duplicar ficha"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteRoutine(routine.id, routine.name)}
                          className="p-2 border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-rose-400 transition-colors"
                          title="Excluir ficha"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Primary CTA: Launch Live Workout Mode */}
                      <button
                        type="button"
                        onClick={() => handleStartWorkout(routine)}
                        className="px-5 py-2.5 bg-white text-black hover:bg-zinc-200 font-hud font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-md active:scale-95"
                      >
                        <Play className="w-3.5 h-3.5 fill-black" />
                        <span>INICIAR TREINO</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PERFORMANCE & EFFORT ANALYTICS */}
      {activeTab === "analytics" && <TrainingAnalytics workouts={workouts} />}

      {/* TAB 3: CARDIO LAB */}
      {activeTab === "cardio" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Quick Cardio Session Logger */}
          <div className="border border-zinc-800 bg-black p-4 sm:p-6 space-y-4">
            <div className="border-b border-zinc-800 pb-3">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">
                TELEMETRIA AERÓBICA & CONDICIONAMENTO
              </span>
              <h3 className="text-base font-hud font-bold text-white tracking-wider">
                REGISTRAR SESSÃO DE CARDIO
              </h3>
            </div>

            <form onSubmit={handleLogCardioSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-zinc-400 uppercase">Modalidade</label>
                <select
                  value={cardioSport}
                  onChange={(e) => setCardioSport(e.target.value as any)}
                  className="w-full bg-zinc-900 border border-zinc-700 text-white px-3 py-2 text-xs font-mono"
                >
                  <option value="Running">Corrida (Running)</option>
                  <option value="Cycling">Ciclismo (Cycling)</option>
                  <option value="Swimming">Natação (Swimming)</option>
                  <option value="HIIT">HIIT / Circuitos</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-zinc-400 uppercase">Distância (KM)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={cardioKm}
                  onChange={(e) => setCardioKm(parseFloat(e.target.value) || 0)}
                  className="w-full bg-zinc-900 border border-zinc-700 text-white px-3 py-2 text-xs font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-zinc-400 uppercase">Duração (Minutos)</label>
                <input
                  type="number"
                  min="1"
                  value={cardioMin}
                  onChange={(e) => setCardioMin(parseInt(e.target.value) || 0)}
                  className="w-full bg-zinc-900 border border-zinc-700 text-white px-3 py-2 text-xs font-mono"
                  required
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 bg-white text-black hover:bg-zinc-200 font-hud font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>REGISTRAR CARDIO</span>
                </button>
              </div>
            </form>
          </div>

          {/* Cardio History List */}
          <div className="border border-zinc-800 bg-black p-4 sm:p-6 space-y-4">
            <div className="border-b border-zinc-800 pb-3 flex items-center justify-between">
              <h3 className="text-base font-hud font-bold text-white tracking-wider">
                HISTÓRICO AERÓBICO ({cardioSessions.length})
              </h3>
              <span className="text-xs font-mono text-zinc-500">
                Total acumulado: {cardioSessions.reduce((acc, c) => acc + c.distanceKm, 0).toFixed(1)} km
              </span>
            </div>

            {cardioSessions.length === 0 ? (
              <p className="text-xs font-mono text-zinc-500 text-center py-6">
                Nenhuma sessão de cardio registrada ainda.
              </p>
            ) : (
              <div className="space-y-2">
                {cardioSessions.map((session) => (
                  <div
                    key={session.id}
                    className="border border-zinc-800 bg-zinc-950 p-3 flex items-center justify-between text-xs font-mono"
                  >
                    <div>
                      <span className="font-bold text-white block">
                        {session.sport} • {session.distanceKm} km
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {session.date} • {session.durationMinutes} min • Pace {session.avgPace}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-white font-bold block">{session.caloriesBurned} kcal</span>
                      <span className="text-[10px] text-zinc-500">FC Média: {session.avgHeartRate} bpm</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Routine Builder Modal */}
      <RoutineBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => {
          setIsBuilderOpen(false);
          setEditingRoutine(null);
        }}
        onSaveRoutine={handleSaveRoutine}
        editingRoutine={editingRoutine}
        currentScaleType={scaleType}
      />
    </div>
  );
};
