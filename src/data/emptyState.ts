import {
  BodyMetrics,
  CardioSession,
  DataCorrelation,
  GoalItem,
  HabitItem,
  HealthRecord,
  NutritionLog,
  SleepMetrics,
  SystemStatusScores,
  WorkoutSession,
} from "../types";

// Zero-State System Status: Not calibrated until telemetry is collected
export const zeroSystemStatus: SystemStatusScores = {
  overall: 0,
  training: 0,
  nutrition: 0,
  sleep: 0,
  recovery: 0,
  activity: 0,
  consistency: 0,
};

export function createInitialCleanBodyMetrics(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: "male" | "female"
): BodyMetrics {
  const dateStr = new Date().toISOString().split("T")[0];
  return {
    weightKg,
    heightCm,
    age,
    gender,
    bodyFatPercent: 0, // Awaiting first caliper / bioimpedance entry
    leanMassKg: 0,
    muscleMassKg: 0,
    visceralFat: 0,
    evolution: [
      {
        period: "DIA 0",
        date: dateStr,
        weightKg,
        bodyFatPercent: 0,
        muscleMassKg: 0,
        waistCm: 0,
        chestCm: 0,
        armCm: 0,
      },
    ],
    regions: {
      abdomen: {
        id: "abdomen",
        name: "Abdômen",
        currentCm: 0,
        janCm: 0,
        aprCm: 0,
        julCm: 0,
        sepCm: 0,
        trend: "stable",
        delta: "0 cm",
        lastMeasured: "Aguardando medição",
      },
      chest: {
        id: "chest",
        name: "Peitoral",
        currentCm: 0,
        janCm: 0,
        aprCm: 0,
        julCm: 0,
        sepCm: 0,
        trend: "stable",
        delta: "0 cm",
        lastMeasured: "Aguardando medição",
      },
      arm_right: {
        id: "arm_right",
        name: "Braço Direito",
        currentCm: 0,
        janCm: 0,
        aprCm: 0,
        julCm: 0,
        sepCm: 0,
        trend: "stable",
        delta: "0 cm",
        lastMeasured: "Aguardando medição",
      },
      arm_left: {
        id: "arm_left",
        name: "Braço Esquerdo",
        currentCm: 0,
        janCm: 0,
        aprCm: 0,
        julCm: 0,
        sepCm: 0,
        trend: "stable",
        delta: "0 cm",
        lastMeasured: "Aguardando medição",
      },
      shoulders: {
        id: "shoulders",
        name: "Ombros (Deltoides)",
        currentCm: 0,
        janCm: 0,
        aprCm: 0,
        julCm: 0,
        sepCm: 0,
        trend: "stable",
        delta: "0 cm",
        lastMeasured: "Aguardando medição",
      },
      thigh_right: {
        id: "thigh_right",
        name: "Coxa Direita",
        currentCm: 0,
        janCm: 0,
        aprCm: 0,
        julCm: 0,
        sepCm: 0,
        trend: "stable",
        delta: "0 cm",
        lastMeasured: "Aguardando medição",
      },
    },
  };
}

export const cleanNutrition: NutritionLog = {
  caloriesTarget: 2200,
  caloriesCurrent: 0,
  proteinTargetG: 160,
  proteinCurrentG: 0,
  carbsTargetG: 220,
  carbsCurrentG: 0,
  fatTargetG: 65,
  fatCurrentG: 0,
  fiberCurrentG: 0,
  waterTargetMl: 3000,
  waterCurrentMl: 0,
  caffeineMg: 0,
  meals: [],
};

export const cleanSleep: SleepMetrics = {
  durationHours: 0,
  bedTime: "--:--",
  wakeTime: "--:--",
  consistencyPercent: 0,
  deepSleepPercent: 0,
  remSleepPercent: 0,
  lightSleepPercent: 0,
  awakeMinutes: 0,
  restingHeartRateBpm: 0,
  hrvMs: 0,
  recoveryScore: 0,
};

export const emptyWorkouts: WorkoutSession[] = [];
export const emptyCardio: CardioSession[] = [];
export const emptyHabits: HabitItem[] = [];
export const emptyGoals: GoalItem[] = [];
export const emptyCorrelations: DataCorrelation[] = [];
export const emptyHealthTimeline: HealthRecord[] = [];
