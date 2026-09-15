// GL PERSONAL RECORD (PR) ENGINE // LABCORE BIOMECHANICAL AUDIT
// Detects real personal records achieved across resistance and cardiovascular telemetry.
// Principle: NEVER create artificial PRs. Only completed sessions with verified sets are eligible.

import { WorkoutSession, CardioSession } from "../types";
import { estimateOneRepMax } from "./oneRepMaxEngine";

export interface ExercisePersonalRecord {
  exerciseName: string;
  muscleGroup: string;
  maxLoad: {
    valueKg: number;
    repsAchieved: number;
    date: string;
    workoutId: string;
  } | null;
  maxReps: {
    reps: number;
    weightKg: number;
    date: string;
    workoutId: string;
  } | null;
  maxSetVolumeKg: {
    volumeKg: number;
    weightKg: number;
    reps: number;
    date: string;
    workoutId: string;
  } | null;
  estimated1RmMax: {
    valueKg: number;
    basedOnWeightKg: number;
    basedOnReps: number;
    formula: string;
    date: string;
    workoutId: string;
  } | null;
  evolutionHistory: {
    date: string;
    type: "LOAD" | "REPS" | "VOLUME" | "1RM_ESTIMATED";
    recordValue: string;
    detail: string;
  }[];
}

export interface CardioPersonalRecord {
  sport: string;
  bestDistanceKm: {
    distanceKm: number;
    durationMinutes: number;
    date: string;
  } | null;
  bestPace: {
    paceString: string;
    paceSecondsPerKm: number;
    distanceKm: number;
    date: string;
  } | null;
  longestDurationMinutes: {
    minutes: number;
    distanceKm: number;
    date: string;
  } | null;
}

export interface OverallPrVault {
  hasRecords: boolean;
  totalStrengthPrs: number;
  totalCardioPrs: number;
  strengthPrs: ExercisePersonalRecord[];
  cardioPrs: CardioPersonalRecord[];
  allTimeTonnageWorkout: {
    volumeKg: number;
    workoutName: string;
    date: string;
  } | null;
}

export function computePersonalRecords(
  workouts: WorkoutSession[],
  cardioSessions: CardioSession[]
): OverallPrVault {
  const completedWorkouts = workouts.filter((w) => w.status === "completed");

  // If no workouts or cardio, return strictly empty state without fake records
  if (completedWorkouts.length === 0 && cardioSessions.length === 0) {
    return {
      hasRecords: false,
      totalStrengthPrs: 0,
      totalCardioPrs: 0,
      strengthPrs: [],
      cardioPrs: [],
      allTimeTonnageWorkout: null,
    };
  }

  // 1. Process Strength Exercises
  const exerciseMap: Record<
    string,
    {
      muscleGroup: string;
      maxLoad: ExercisePersonalRecord["maxLoad"];
      maxReps: ExercisePersonalRecord["maxReps"];
      maxSetVolume: ExercisePersonalRecord["maxSetVolumeKg"];
      estimated1RmMax: ExercisePersonalRecord["estimated1RmMax"];
      evolution: ExercisePersonalRecord["evolutionHistory"];
    }
  > = {};

  let allTimeTonnage: OverallPrVault["allTimeTonnageWorkout"] = null;

  // Chronological sort
  const sortedWorkouts = [...completedWorkouts].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  for (const w of sortedWorkouts) {
    if (w.totalVolumeKg && (!allTimeTonnage || w.totalVolumeKg > allTimeTonnage.volumeKg)) {
      allTimeTonnage = {
        volumeKg: w.totalVolumeKg,
        workoutName: w.name,
        date: w.date,
      };
    }

    for (const ex of w.exercises) {
      const name = ex.name.trim();
      if (!name) continue;

      if (!exerciseMap[name]) {
        exerciseMap[name] = {
          muscleGroup: ex.muscleGroup || "Geral",
          maxLoad: null,
          maxReps: null,
          maxSetVolume: null,
          estimated1RmMax: null,
          evolution: [],
        };
      }

      const rec = exerciseMap[name];
      const completedSets = (ex.sets || []).filter((s) => s.completed);

      for (const s of completedSets) {
        const load = s.weightKg || 0;
        const reps = s.reps || 0;
        const setVol = load * reps;

        // Check Max Load
        if (!rec.maxLoad || load > rec.maxLoad.valueKg) {
          rec.maxLoad = {
            valueKg: load,
            repsAchieved: reps,
            date: w.date,
            workoutId: w.id,
          };
          rec.evolution.push({
            date: w.date,
            type: "LOAD",
            recordValue: `${load} kg`,
            detail: `${reps} reps em ${w.name}`,
          });
        }

        // Check Max Reps
        if (!rec.maxReps || reps > rec.maxReps.reps) {
          rec.maxReps = {
            reps,
            weightKg: load,
            date: w.date,
            workoutId: w.id,
          };
          rec.evolution.push({
            date: w.date,
            type: "REPS",
            recordValue: `${reps} reps`,
            detail: `com ${load} kg`,
          });
        }

        // Check Max Set Volume
        if (!rec.maxSetVolume || setVol > rec.maxSetVolume.volumeKg) {
          rec.maxSetVolume = {
            volumeKg: setVol,
            weightKg: load,
            reps,
            date: w.date,
            workoutId: w.id,
          };
          rec.evolution.push({
            date: w.date,
            type: "VOLUME",
            recordValue: `${setVol} kg`,
            detail: `${reps} × ${load} kg na série`,
          });
        }

        // Check Estimated 1RM
        if (load > 0 && reps > 0) {
          const e1rm = estimateOneRepMax(load, reps, "Epley");
          if (
            e1rm &&
            (!rec.estimated1RmMax || e1rm.estimated1RmKg > rec.estimated1RmMax.valueKg)
          ) {
            rec.estimated1RmMax = {
              valueKg: e1rm.estimated1RmKg,
              basedOnWeightKg: load,
              basedOnReps: reps,
              formula: "Epley (1985)",
              date: w.date,
              workoutId: w.id,
            };
            rec.evolution.push({
              date: w.date,
              type: "1RM_ESTIMATED",
              recordValue: `${e1rm.estimated1RmKg} kg e1RM`,
              detail: `Submáximo calculado de ${load} kg × ${reps} reps`,
            });
          }
        }
      }
    }
  }

  const strengthPrs: ExercisePersonalRecord[] = Object.entries(exerciseMap).map(
    ([exerciseName, data]) => ({
      exerciseName,
      muscleGroup: data.muscleGroup,
      maxLoad: data.maxLoad,
      maxReps: data.maxReps,
      maxSetVolumeKg: data.maxSetVolume,
      estimated1RmMax: data.estimated1RmMax,
      evolutionHistory: data.evolution.reverse(), // most recent first
    })
  );

  // 2. Process Cardio Sessions
  const cardioMap: Record<string, CardioPersonalRecord> = {};

  for (const c of cardioSessions) {
    const sport = c.sport || "Running";
    if (!cardioMap[sport]) {
      cardioMap[sport] = {
        sport,
        bestDistanceKm: null,
        bestPace: null,
        longestDurationMinutes: null,
      };
    }

    const entry = cardioMap[sport];

    // Distance PR
    if (c.distanceKm && (!entry.bestDistanceKm || c.distanceKm > entry.bestDistanceKm.distanceKm)) {
      entry.bestDistanceKm = {
        distanceKm: c.distanceKm,
        durationMinutes: c.durationMinutes,
        date: c.date,
      };
    }

    // Duration PR
    if (
      c.durationMinutes &&
      (!entry.longestDurationMinutes || c.durationMinutes > entry.longestDurationMinutes.minutes)
    ) {
      entry.longestDurationMinutes = {
        minutes: c.durationMinutes,
        distanceKm: c.distanceKm,
        date: c.date,
      };
    }

    // Pace PR (lower is better)
    if (c.avgPace && c.distanceKm && c.distanceKm >= 1) {
      const paceParts = c.avgPace.replace(/[^0-9:]/g, "").split(":");
      if (paceParts.length === 2) {
        const paceSec = parseInt(paceParts[0], 10) * 60 + parseInt(paceParts[1], 10);
        if (
          paceSec > 120 &&
          (!entry.bestPace || paceSec < entry.bestPace.paceSecondsPerKm)
        ) {
          entry.bestPace = {
            paceString: c.avgPace,
            paceSecondsPerKm: paceSec,
            distanceKm: c.distanceKm,
            date: c.date,
          };
        }
      }
    }
  }

  const cardioPrs = Object.values(cardioMap);

  return {
    hasRecords: strengthPrs.length > 0 || cardioPrs.length > 0,
    totalStrengthPrs: strengthPrs.length,
    totalCardioPrs: cardioPrs.length,
    strengthPrs,
    cardioPrs,
    allTimeTonnageWorkout: allTimeTonnage,
  };
}
