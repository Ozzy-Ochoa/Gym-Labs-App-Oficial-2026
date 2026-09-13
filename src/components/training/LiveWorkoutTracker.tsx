import React, { useState, useEffect, useRef } from "react";
import {
  UserWorkoutRoutine,
  WorkoutSession,
  WorkoutExercise,
  ExerciseSet,
} from "../../types";
import { MASTER_EXERCISE_CATALOG, CatalogExercise, calculateActivityCalories } from "../../data/exerciseCatalog";
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Check,
  CheckCircle2,
  Plus,
  Trash2,
  Flame,
  AlertTriangle,
  Award,
  Zap,
  Dumbbell,
  X,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

interface LiveWorkoutTrackerProps {
  routine: UserWorkoutRoutine;
  onFinishWorkout: (session: WorkoutSession) => void;
  onCancelWorkout: () => void;
  userWeightKg?: number;
}

interface ActiveExerciseItem {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  sets: {
    setNumber: number;
    weightKg: number;
    reps: number;
    completed: boolean;
    toFailure: boolean;
    failureRep?: number;
    rpe: number;
    previousTarget?: string;
  }[];
}

export const LiveWorkoutTracker: React.FC<LiveWorkoutTrackerProps> = ({
  routine,
  onFinishWorkout,
  onCancelWorkout,
  userWeightKg = 75,
}) => {
  // Session stopwatch
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Rest timer
  const [restDuration, setRestDuration] = useState(90); // default 90s
  const [restRemaining, setRestRemaining] = useState(0);
  const [isRestActive, setIsRestActive] = useState(false);

  // Workout state initialized from routine exercises
  const [activeExercises, setActiveExercises] = useState<ActiveExerciseItem[]>(() => {
    return routine.exercises.map((ex, idx) => {
      const parsedReps = parseInt(ex.reps.split("-")[0]) || 10;
      return {
        id: `live_ex_${idx}_${Date.now()}`,
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        equipment: ex.equipment || "Livre",
        sets: Array.from({ length: Math.max(1, ex.sets) }).map((_, sIdx) => ({
          setNumber: sIdx + 1,
          weightKg: ex.suggestedWeightKg || 20,
          reps: parsedReps,
          completed: false,
          toFailure: false,
          failureRep: parsedReps,
          rpe: 8,
          previousTarget: `${ex.suggestedWeightKg || 20}kg × ${ex.reps}`,
        })),
      };
    });
  });

  // Modal for adding extra exercises during session
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState("");

  // Post-workout summary debrief modal state
  const [completedSessionResult, setCompletedSessionResult] = useState<WorkoutSession | null>(null);

  // Audio beep effect for rest timer completion
  const playRestAlert = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch {}
  };

  // Stopwatch effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (!isPaused) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPaused]);

  // Rest timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRestActive && restRemaining > 0) {
      interval = setInterval(() => {
        setRestRemaining((prev) => {
          if (prev <= 1) {
            setIsRestActive(false);
            playRestAlert();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRestActive, restRemaining]);

  const startRestTimer = (seconds?: number) => {
    const sec = seconds ?? restDuration;
    setRestRemaining(sec);
    setIsRestActive(true);
  };

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Set management
  const handleToggleSetComplete = (exIdx: number, setIdx: number) => {
    setActiveExercises((prev) => {
      const copy = [...prev];
      const targetEx = { ...copy[exIdx] };
      const targetSets = [...targetEx.sets];
      const currentStatus = targetSets[setIdx].completed;

      targetSets[setIdx] = {
        ...targetSets[setIdx],
        completed: !currentStatus,
      };
      targetEx.sets = targetSets;
      copy[exIdx] = targetEx;
      return copy;
    });

    // Automatically trigger rest timer when marked complete
    if (!activeExercises[exIdx].sets[setIdx].completed) {
      startRestTimer(restDuration);
    }
  };

  const handleToggleFailure = (exIdx: number, setIdx: number) => {
    setActiveExercises((prev) => {
      const copy = [...prev];
      const targetEx = { ...copy[exIdx] };
      const targetSets = [...targetEx.sets];
      const currentFailure = targetSets[setIdx].toFailure;
      const currentReps = targetSets[setIdx].reps;

      targetSets[setIdx] = {
        ...targetSets[setIdx],
        toFailure: !currentFailure,
        failureRep: !currentFailure ? currentReps : undefined,
        rpe: !currentFailure ? 10 : 8,
      };
      targetEx.sets = targetSets;
      copy[exIdx] = targetEx;
      return copy;
    });
  };

  const handleUpdateFailureRep = (exIdx: number, setIdx: number, rep: number) => {
    setActiveExercises((prev) => {
      const copy = [...prev];
      const targetEx = { ...copy[exIdx] };
      const targetSets = [...targetEx.sets];
      targetSets[setIdx] = {
        ...targetSets[setIdx],
        failureRep: Math.max(1, rep),
      };
      targetEx.sets = targetSets;
      copy[exIdx] = targetEx;
      return copy;
    });
  };

  const handleUpdateSetWeight = (exIdx: number, setIdx: number, delta: number) => {
    setActiveExercises((prev) => {
      const copy = [...prev];
      const targetEx = { ...copy[exIdx] };
      const targetSets = [...targetEx.sets];
      const currentWeight = targetSets[setIdx].weightKg;
      targetSets[setIdx] = {
        ...targetSets[setIdx],
        weightKg: Math.max(0, parseFloat((currentWeight + delta).toFixed(1))),
      };
      targetEx.sets = targetSets;
      copy[exIdx] = targetEx;
      return copy;
    });
  };

  const handleSetDirectWeight = (exIdx: number, setIdx: number, val: number) => {
    setActiveExercises((prev) => {
      const copy = [...prev];
      const targetEx = { ...copy[exIdx] };
      const targetSets = [...targetEx.sets];
      targetSets[setIdx] = {
        ...targetSets[setIdx],
        weightKg: Math.max(0, val),
      };
      targetEx.sets = targetSets;
      copy[exIdx] = targetEx;
      return copy;
    });
  };

  const handleUpdateSetReps = (exIdx: number, setIdx: number, delta: number) => {
    setActiveExercises((prev) => {
      const copy = [...prev];
      const targetEx = { ...copy[exIdx] };
      const targetSets = [...targetEx.sets];
      const currentReps = targetSets[setIdx].reps;
      const newReps = Math.max(1, currentReps + delta);
      targetSets[setIdx] = {
        ...targetSets[setIdx],
        reps: newReps,
        failureRep: targetSets[setIdx].toFailure ? newReps : targetSets[setIdx].failureRep,
      };
      targetEx.sets = targetSets;
      copy[exIdx] = targetEx;
      return copy;
    });
  };

  const handleAddSetToExercise = (exIdx: number) => {
    setActiveExercises((prev) => {
      const copy = [...prev];
      const targetEx = { ...copy[exIdx] };
      const lastSet = targetEx.sets[targetEx.sets.length - 1];
      const newSetNumber = targetEx.sets.length + 1;

      targetEx.sets = [
        ...targetEx.sets,
        {
          setNumber: newSetNumber,
          weightKg: lastSet ? lastSet.weightKg : 20,
          reps: lastSet ? lastSet.reps : 10,
          completed: false,
          toFailure: false,
          failureRep: lastSet ? lastSet.reps : 10,
          rpe: 8,
          previousTarget: lastSet ? `${lastSet.weightKg}kg × ${lastSet.reps}` : undefined,
        },
      ];
      copy[exIdx] = targetEx;
      return copy;
    });
  };

  const handleRemoveSet = (exIdx: number, setIdx: number) => {
    setActiveExercises((prev) => {
      const copy = [...prev];
      const targetEx = { ...copy[exIdx] };
      if (targetEx.sets.length <= 1) return prev;
      targetEx.sets = targetEx.sets
        .filter((_, i) => i !== setIdx)
        .map((s, idx) => ({ ...s, setNumber: idx + 1 }));
      copy[exIdx] = targetEx;
      return copy;
    });
  };

  // Add extra exercise during workout
  const handleAddExtraExercise = (catEx: CatalogExercise) => {
    setActiveExercises((prev) => [
      ...prev,
      {
        id: `extra_ex_${Date.now()}`,
        name: catEx.name,
        muscleGroup: catEx.muscleGroup,
        equipment: catEx.equipment,
        sets: Array.from({ length: catEx.defaultSets }).map((_, sIdx) => ({
          setNumber: sIdx + 1,
          weightKg: catEx.defaultWeightKg,
          reps: parseInt(catEx.defaultReps.split("-")[0]) || 10,
          completed: false,
          toFailure: false,
          failureRep: parseInt(catEx.defaultReps.split("-")[0]) || 10,
          rpe: 8,
          previousTarget: `${catEx.defaultWeightKg}kg × ${catEx.defaultReps}`,
        })),
      },
    ]);
    setIsAddingExercise(false);
    setExerciseSearch("");
  };

  // Live session computations
  const totalCompletedSets = activeExercises.reduce(
    (sum, ex) => sum + ex.sets.filter((s) => s.completed).length,
    0
  );
  const totalPossibleSets = activeExercises.reduce((sum, ex) => sum + ex.sets.length, 0);

  const totalVolumeKg = activeExercises.reduce((sum, ex) => {
    return (
      sum +
      ex.sets.reduce((exSum, s) => {
        if (!s.completed) return exSum;
        return exSum + s.weightKg * s.reps;
      }, 0)
    );
  }, 0);

  const totalFailureSetsCount = activeExercises.reduce((sum, ex) => {
    return sum + ex.sets.filter((s) => s.completed && s.toFailure).length;
  }, 0);

  // Finish Workout Action
  const handleFinish = () => {
    if (totalCompletedSets === 0) {
      if (!confirm("Nenhuma série foi marcada como concluída. Deseja finalizar mesmo assim?")) {
        return;
      }
    }

    const durationMin = Math.max(1, Math.round(elapsedSeconds / 60));
    const finalExercises: WorkoutExercise[] = activeExercises.map((ex, idx) => {
      const exerciseSets: ExerciseSet[] = ex.sets.map((s) => ({
        setNumber: s.setNumber,
        weightKg: s.weightKg,
        reps: s.reps,
        completed: s.completed,
        rpe: s.rpe,
        toFailure: s.toFailure,
        failureRep: s.failureRep,
      }));

      const maxWeight = Math.max(0, ...ex.sets.map((s) => s.weightKg));

      return {
        id: `ex_${Date.now()}_${idx}`,
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        equipment: ex.equipment,
        personalRecordKg: maxWeight,
        sets: exerciseSets,
      };
    });

    const calculatedCalories = calculateActivityCalories(
      5.5,
      userWeightKg,
      durationMin,
      totalCompletedSets,
      totalVolumeKg
    );

    const session: WorkoutSession = {
      id: `w_live_${Date.now()}`,
      name: routine.name,
      category: routine.category || "Hypertrophy",
      status: "completed",
      date: new Date().toISOString().split("T")[0],
      durationMinutes: durationMin,
      totalVolumeKg,
      avgRpe: totalCompletedSets > 0 ? (totalFailureSetsCount > 0 ? 8.8 : 7.8) : 7.0,
      exercises: finalExercises,
      totalFailureSets: totalFailureSetsCount,
      routineScaleSlot: routine.scaleSlot,
      caloriesBurned: calculatedCalories,
    };

    setCompletedSessionResult(session);
  };

  // Close summary modal and commit
  const handleDismissDebrief = () => {
    if (completedSessionResult) {
      onFinishWorkout(completedSessionResult);
    }
  };

  return (
    <div className="space-y-4 pb-20 animate-fadeIn">
      {/* HUD Active Workout Bar */}
      <div className="sticky top-14 z-30 bg-black/95 backdrop-blur-md border border-zinc-700 p-3 sm:p-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Workout Title & Timer */}
          <div className="flex items-center justify-between md:justify-start gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="text-[10px] font-mono text-white uppercase tracking-widest font-bold">
                  SESSÃO ATIVA // {routine.scaleSlot}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-hud font-bold text-white tracking-wider truncate max-w-[280px] sm:max-w-md">
                {routine.name}
              </h2>
            </div>

            {/* Stopwatch */}
            <div className="flex items-center gap-2 border border-zinc-700 bg-zinc-900 px-3 py-1.5 font-mono">
              <Timer className="w-4 h-4 text-zinc-400" />
              <span className="text-sm font-bold text-white">{formatTime(elapsedSeconds)}</span>
              <button
                type="button"
                onClick={() => setIsPaused(!isPaused)}
                className="p-0.5 text-zinc-400 hover:text-white transition-colors"
                title={isPaused ? "Retomar" : "Pausar"}
              >
                {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Real-time Tonnage, Calories & Set Stats */}
          <div className="flex items-center justify-between md:justify-end gap-3 sm:gap-5 border-t md:border-t-0 border-zinc-800 pt-2 md:pt-0">
            <div className="text-left md:text-right">
              <span className="text-[9px] font-mono text-zinc-500 uppercase block">GASTO ESTIMADO</span>
              <span className="text-sm sm:text-base font-hud font-bold text-white tracking-wider flex items-center gap-1 md:justify-end">
                <Flame className="w-3.5 h-3.5 text-zinc-400" />
                {calculateActivityCalories(
                  5.5,
                  userWeightKg,
                  Math.max(1, Math.round(elapsedSeconds / 60)),
                  totalCompletedSets,
                  totalVolumeKg
                )} <span className="text-xs text-zinc-400 font-mono">KCAL</span>
              </span>
            </div>

            <div className="text-left md:text-right">
              <span className="text-[9px] font-mono text-zinc-500 uppercase block">VOLUME TOTAL</span>
              <span className="text-sm sm:text-base font-hud font-bold text-white tracking-wider">
                {totalVolumeKg.toLocaleString()} <span className="text-xs text-zinc-400 font-mono">KG</span>
              </span>
            </div>

            <div className="text-left md:text-right">
              <span className="text-[9px] font-mono text-zinc-500 uppercase block">SÉRIES FEITAS</span>
              <span className="text-sm sm:text-base font-hud font-bold text-white">
                {totalCompletedSets}
                <span className="text-xs text-zinc-500 font-mono">/{totalPossibleSets}</span>
              </span>
            </div>

            <div className="text-left md:text-right">
              <span className="text-[9px] font-mono text-zinc-500 uppercase block">SÉRIES NA FALHA</span>
              <span className="text-sm sm:text-base font-hud font-bold text-white flex items-center gap-1 md:justify-end">
                <Flame className="w-3.5 h-3.5 text-zinc-300" />
                {totalFailureSetsCount}
              </span>
            </div>

            {/* Finish Workout Action */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleFinish}
                className="px-4 py-2 bg-white text-black hover:bg-zinc-200 font-hud font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>FINALIZAR</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm("Deseja realmente cancelar e descartar esta sessão de treino?")) {
                    onCancelWorkout();
                  }
                }}
                className="p-2 border border-zinc-800 text-zinc-500 hover:text-white transition-colors"
                title="Descartar treino"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Integrated Rest Timer Drawer / Alert */}
        <div className="mt-2 pt-2 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider">
              DESCANSO ({restDuration}s):
            </span>
            <div className="flex items-center gap-1">
              {[45, 60, 90, 120, 180].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => {
                    setRestDuration(sec);
                    if (isRestActive) setRestRemaining(sec);
                  }}
                  className={`px-1.5 py-0.5 text-[10px] border ${
                    restDuration === sec
                      ? "border-white bg-zinc-800 text-white font-bold"
                      : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white"
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isRestActive ? (
              <div className="flex items-center gap-2 px-2 py-0.5 bg-zinc-900 border border-zinc-500 text-white animate-pulse">
                <Timer className="w-3.5 h-3.5 text-white" />
                <span className="font-bold text-white">{formatTime(restRemaining)}</span>
                <button
                  type="button"
                  onClick={() => setIsRestActive(false)}
                  className="text-zinc-400 hover:text-white text-[10px] uppercase ml-1 underline"
                >
                  Pular
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => startRestTimer(restDuration)}
                className="px-2 py-0.5 border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white text-[10px] uppercase flex items-center gap-1"
              >
                <Play className="w-3 h-3" />
                <span>INICIAR DESCANSO</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsAddingExercise(true)}
              className="px-2 py-0.5 border border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white text-[10px] uppercase flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>+ EXERCÍCIO EXTRA</span>
            </button>
          </div>
        </div>
      </div>

      {/* Extra Exercise Catalog Modal */}
      {isAddingExercise && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-zinc-950 border border-zinc-700 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-hud font-bold text-sm text-white uppercase tracking-wider">
                ADICIONAR EXERCÍCIO EXTRA À SESSÃO
              </h3>
              <button
                onClick={() => setIsAddingExercise(false)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              type="text"
              value={exerciseSearch}
              onChange={(e) => setExerciseSearch(e.target.value)}
              placeholder="Buscar exercício pelo nome..."
              className="w-full bg-black border border-zinc-800 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-white"
            />
            <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
              {MASTER_EXERCISE_CATALOG.filter((ex) =>
                ex.name.toLowerCase().includes(exerciseSearch.toLowerCase())
              ).map((catEx) => (
                <button
                  key={catEx.id}
                  type="button"
                  onClick={() => handleAddExtraExercise(catEx)}
                  className="w-full text-left p-2.5 border border-zinc-800 bg-black hover:border-white transition-colors flex items-center justify-between text-xs font-mono"
                >
                  <div>
                    <span className="font-bold text-white block">{catEx.name}</span>
                    <span className="text-[10px] text-zinc-500">
                      {catEx.muscleGroup} • {catEx.equipment}
                    </span>
                  </div>
                  <Plus className="w-4 h-4 text-zinc-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Exercise Cards */}
      <div className="space-y-4">
        {activeExercises.map((exercise, exIdx) => (
          <div
            key={exercise.id}
            className="border border-zinc-800 bg-black p-4 sm:p-5 space-y-3 shadow-lg"
          >
            {/* Exercise Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800 pb-3 gap-2">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 border border-zinc-700 bg-zinc-900 text-white font-hud font-bold text-xs flex items-center justify-center">
                  {exIdx + 1}
                </div>
                <div>
                  <h3 className="font-hud font-bold text-sm sm:text-base text-white tracking-wide">
                    {exercise.name}
                  </h3>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">
                    {exercise.muscleGroup} • {exercise.equipment}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => handleAddSetToExercise(exIdx)}
                  className="px-2.5 py-1 bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white font-mono text-[11px] uppercase flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>SÉRIE</span>
                </button>
              </div>
            </div>

            {/* Sets Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-[10px] text-zinc-500 uppercase">
                    <th className="py-2 px-2 w-12 text-center">SET</th>
                    <th className="py-2 px-2 hidden sm:table-cell w-28">ALVO</th>
                    <th className="py-2 px-2 w-36">CARGA (KG)</th>
                    <th className="py-2 px-2 w-28">REPS</th>
                    <th className="py-2 px-2 w-32 text-center">FALHA MUSCULAR</th>
                    <th className="py-2 px-2 w-16 text-center">STATUS</th>
                    <th className="py-2 px-1 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {exercise.sets.map((set, setIdx) => (
                    <tr
                      key={set.setNumber}
                      className={`transition-colors ${
                        set.completed
                          ? "bg-zinc-900/50 text-white"
                          : "hover:bg-zinc-950 text-zinc-300"
                      }`}
                    >
                      {/* Set Number */}
                      <td className="py-2 px-2 text-center font-bold">
                        <span
                          className={`inline-block w-6 h-6 leading-6 border text-[11px] ${
                            set.completed
                              ? "border-emerald-700/80 bg-emerald-950/40 text-emerald-400"
                              : "border-zinc-800 bg-zinc-900 text-zinc-400"
                          }`}
                        >
                          {set.setNumber}
                        </span>
                      </td>

                      {/* Previous / Target */}
                      <td className="py-2 px-2 hidden sm:table-cell text-[11px] text-zinc-500">
                        {set.previousTarget || "—"}
                      </td>

                      {/* Weight Stepper & Input */}
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateSetWeight(exIdx, setIdx, -2.5)}
                            className="w-6 h-6 border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs flex items-center justify-center font-bold"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            step="0.5"
                            value={set.weightKg}
                            onChange={(e) =>
                              handleSetDirectWeight(
                                exIdx,
                                setIdx,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-14 bg-zinc-900 border border-zinc-700 text-center py-1 text-xs text-white font-bold focus:outline-none focus:border-white"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateSetWeight(exIdx, setIdx, 2.5)}
                            className="w-6 h-6 border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs flex items-center justify-center font-bold"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Reps Stepper */}
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateSetReps(exIdx, setIdx, -1)}
                            className="w-6 h-6 border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs flex items-center justify-center font-bold"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            value={set.reps}
                            onChange={(e) =>
                              handleUpdateSetReps(
                                exIdx,
                                setIdx,
                                (parseInt(e.target.value) || 1) - set.reps
                              )
                            }
                            className="w-12 bg-zinc-900 border border-zinc-700 text-center py-1 text-xs text-white font-bold focus:outline-none focus:border-white"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateSetReps(exIdx, setIdx, 1)}
                            className="w-6 h-6 border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs flex items-center justify-center font-bold"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Failure Toggle & Failure Rep Picker */}
                      <td className="py-2 px-2 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleFailure(exIdx, setIdx)}
                            className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider font-bold border transition-all flex items-center gap-1 ${
                              set.toFailure
                                ? "bg-zinc-800 border-white text-white"
                                : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
                            }`}
                          >
                            <Flame className={`w-3 h-3 ${set.toFailure ? "text-white" : "text-zinc-600"}`} />
                            <span>{set.toFailure ? "FALHOU" : "FALHA?"}</span>
                          </button>

                          {set.toFailure && (
                            <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                              <span>Na rep:</span>
                              <input
                                type="number"
                                min="1"
                                max={set.reps}
                                value={set.failureRep || set.reps}
                                onChange={(e) =>
                                  handleUpdateFailureRep(
                                    exIdx,
                                    setIdx,
                                    parseInt(e.target.value) || set.reps
                                  )
                                }
                                className="w-9 bg-black border border-zinc-600 text-white text-center py-0.5 text-[10px] font-bold"
                              />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Completed Button */}
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSetComplete(exIdx, setIdx)}
                          className={`w-8 h-8 mx-auto flex items-center justify-center border transition-all active:scale-95 ${
                            set.completed
                              ? "bg-white border-white text-black font-bold"
                              : "bg-zinc-900 border-zinc-700 text-zinc-500 hover:text-white hover:border-zinc-500"
                          }`}
                        >
                          <Check className="w-4 h-4 stroke-[2.5]" />
                        </button>
                      </td>

                      {/* Remove Set Button */}
                      <td className="py-2 px-1 text-right">
                        {exercise.sets.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSet(exIdx, setIdx)}
                            className="text-zinc-600 hover:text-white transition-colors p-1"
                            title="Remover série"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Post-Workout Debriefing Modal (Análise de Esforço Pós-Treino) */}
      {completedSessionResult && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-700 p-5 sm:p-7 space-y-6 shadow-2xl animate-scaleUp">
            {/* Header */}
            <div className="border-b border-zinc-800 pb-4 text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-900 border border-zinc-600 text-white text-[10px] font-mono uppercase tracking-widest mb-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>SESSÃO REGISTRADA COM SUCESSO</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-hud font-bold text-white tracking-wider uppercase">
                DEBRIEFING DE ESFORÇO // GYM LABS
              </h2>
              <p className="text-xs font-mono text-zinc-400">
                {completedSessionResult.name} • {completedSessionResult.durationMinutes} minutos de execução
              </p>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="border border-zinc-800 bg-black p-3.5 text-center">
                <span className="text-[10px] font-mono text-zinc-500 uppercase block">GASTO CALÓRICO</span>
                <span className="text-xl font-hud font-bold text-white">
                  {completedSessionResult.caloriesBurned || 0}
                </span>
                <span className="text-[9px] font-mono text-zinc-500 block">KCAL GASTAS</span>
              </div>

              <div className="border border-zinc-800 bg-black p-3.5 text-center">
                <span className="text-[10px] font-mono text-zinc-500 uppercase block">VOLUME TOTAL</span>
                <span className="text-xl font-hud font-bold text-white">
                  {completedSessionResult.totalVolumeKg.toLocaleString()}
                </span>
                <span className="text-[9px] font-mono text-zinc-500 block">KG LEVANTADOS</span>
              </div>

              <div className="border border-zinc-800 bg-black p-3.5 text-center">
                <span className="text-[10px] font-mono text-zinc-500 uppercase block">SÉRIES FEITAS</span>
                <span className="text-xl font-hud font-bold text-white">
                  {completedSessionResult.exercises.reduce((acc, e) => acc + e.sets.filter((s) => s.completed).length, 0)}
                </span>
                <span className="text-[9px] font-mono text-zinc-500 block">SÉRIES EFETIVAS</span>
              </div>

              <div className="border border-zinc-800 bg-black p-3.5 text-center">
                <span className="text-[10px] font-mono text-zinc-500 uppercase block">FALHA MUSCULAR</span>
                <span className="text-xl font-hud font-bold text-zinc-200">
                  {completedSessionResult.totalFailureSets || 0}
                </span>
                <span className="text-[9px] font-mono text-zinc-500 block">SÉRIES NO LIMITE</span>
              </div>

              <div className="border border-zinc-800 bg-black p-3.5 text-center">
                <span className="text-[10px] font-mono text-zinc-500 uppercase block">INTENSIDADE RPE</span>
                <span className="text-xl font-hud font-bold text-white">
                  {completedSessionResult.avgRpe.toFixed(1)}
                </span>
                <span className="text-[9px] font-mono text-zinc-500 block">MÉDIA PERCEBIDA</span>
              </div>
            </div>

            {/* Biomechanical Insight Box */}
            <div className="border border-zinc-800 bg-black p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-300 font-bold">
                <Zap className="w-4 h-4 text-white" />
                <span>DIAGNÓSTICO BIOMECÂNICO & ADAPTAÇÃO:</span>
              </div>
              <p className="text-xs font-mono text-zinc-400 leading-relaxed">
                {completedSessionResult.totalFailureSets && completedSessionResult.totalFailureSets > 0
                  ? `Você atingiu a falha muscular mecânica em ${completedSessionResult.totalFailureSets} séries. Este estímulo induz alta sinalização de tensão mecânica para hipertrofia miofibrilar. Garanta ingestão adequada de proteína (2.0g/kg) e durma ao menos 7h30 nas próximas 24h para recuperação completa do SNC.`
                  : `Treino finalizado com excelente controle motor e volume consistente. Nas próximas sessões, tente elevar 1 a 2 séries até a falha técnica para maximizar o recrutamento de unidades motoras de alto limiar.`}
              </p>
            </div>

            {/* Exercises Breakdown */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                RESUMO POR EXERCÍCIO:
              </span>
              {completedSessionResult.exercises.map((ex) => {
                const completedSets = ex.sets.filter((s) => s.completed);
                const exVol = completedSets.reduce((sum, s) => sum + s.weightKg * s.reps, 0);
                const failures = completedSets.filter((s) => s.toFailure).length;

                return (
                  <div
                    key={ex.id}
                    className="border border-zinc-800 bg-zinc-900/60 p-2.5 flex items-center justify-between text-xs font-mono"
                  >
                    <div>
                      <span className="font-bold text-white block">{ex.name}</span>
                      <span className="text-[10px] text-zinc-500">
                        {completedSets.length} séries • Carga máxima: {ex.personalRecordKg}kg
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-white block">{exVol.toLocaleString()} kg</span>
                      {failures > 0 && (
                        <span className="text-[10px] text-white font-bold flex items-center gap-1 justify-end">
                          <Flame className="w-3 h-3 text-zinc-300" /> {failures} falhas
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Commit and Close */}
            <div className="border-t border-zinc-800 pt-4 flex items-center justify-end">
              <button
                type="button"
                onClick={handleDismissDebrief}
                className="w-full sm:w-auto px-8 py-3 bg-white text-black hover:bg-zinc-200 font-hud font-bold text-xs uppercase tracking-wider transition-all"
              >
                SALVAR E IR PARA ANALÍTICAS DE TREINO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
