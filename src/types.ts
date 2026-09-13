export type NavigationTab = "home" | "train" | "health" | "lab" | "intelligence" | "settings";

export interface DashboardWidgetConfig {
  showSystemStatus: boolean;
  showBody3D: boolean;
  showTelemetryQuad: boolean;
  showNutritionSummary: boolean;
  showHabitConsistency: boolean;
  showTodayWorkout: boolean;
  showDataInsights: boolean;
}

export interface SystemStatusScores {
  overall: number; // 84
  training: number; // 86
  nutrition: number; // 78
  sleep: number; // 91
  recovery: number; // 82
  activity: number; // 73
  consistency: number; // 89
}

export interface BodyRegion {
  id: string;
  name: string;
  currentCm: number;
  janCm: number;
  aprCm: number;
  julCm: number;
  sepCm: number;
  trend: "decreasing" | "increasing" | "stable";
  delta: string;
  lastMeasured: string;
  isEstimated?: boolean;
}

export interface BodyMetrics {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: "male" | "female";
  bodyFatPercent: number;
  leanMassKg: number;
  muscleMassKg: number;
  visceralFat: number;
  isEstimated?: boolean;
  evolution: {
    period: string;
    date: string;
    weightKg: number;
    bodyFatPercent: number;
    muscleMassKg: number;
    waistCm: number;
    chestCm: number;
    armCm: number;
  }[];
  regions: Record<string, BodyRegion>;
}

export interface MoodLog {
  id: string;
  date: string;
  time: string;
  mood: "EXCELLENT" | "GOOD" | "NEUTRAL" | "TIRED" | "STRESSED";
  energyLevel: number; // 1 to 10
  stressLevel: number; // 1 to 10
  mentalFocus: number; // 1 to 10
  notes?: string;
  readinessScore?: number; // 0 to 100
}

export interface ExerciseSet {
  setNumber: number;
  reps: number;
  weightKg: number;
  rpe: number; // Rate of Perceived Exertion (1-10)
  completed: boolean;
  toFailure?: boolean; // Se a série foi levada até a falha muscular concêntrica
  failureRep?: number; // Repetição específica em que ocorreu a falha
}

export interface WorkoutExercise {
  id: string;
  name: string;
  muscleGroup: string;
  secondaryMuscles?: string[];
  equipment: string;
  sets: ExerciseSet[];
  notes?: string;
  personalRecordKg: number;
}

export type RoutineScaleType = "letters" | "weekdays" | "days";

export interface RoutineExerciseItem {
  id?: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  sets: number;
  reps: string;
  suggestedWeightKg: number;
}

export interface UserWorkoutRoutine {
  id: string;
  name: string;
  focus: string;
  scaleType: RoutineScaleType;
  scaleSlot: string; // e.g. "A", "B", "Segunda", "Terça", "Dia 1", "Dia 2"
  category: "Hypertrophy" | "Strength" | "Cardio" | "Recovery";
  estimatedMinutes: number;
  exercises: RoutineExerciseItem[];
  isSuggested?: boolean;
  estimatedCaloriesBurned?: number;
}

export interface WorkoutSession {
  id: string;
  date: string;
  name: string;
  category: "Strength" | "Hypertrophy" | "Cardio" | "Recovery";
  durationMinutes: number;
  totalVolumeKg: number;
  avgRpe: number;
  exercises: WorkoutExercise[];
  status: "completed" | "active" | "planned";
  totalFailureSets?: number;
  routineScaleSlot?: string;
  caloriesBurned?: number;
}

export interface CardioSession {
  id: string;
  date: string;
  sport: "Running" | "Cycling" | "Swimming" | "HIIT";
  distanceKm: number;
  durationMinutes: number;
  avgPace: string; // e.g. "4:52 /km"
  avgHeartRate: number;
  hrZones: {
    zone1: number; // % in recovery
    zone2: number; // % in aerobic endurance
    zone3: number; // % tempo
    zone4: number; // % threshold
    zone5: number; // % anaerobic
  };
  cadence: number;
  elevationMeters: number;
  caloriesBurned: number;
}

export interface MealItem {
  id: string;
  time: string;
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  items: string[];
}

export interface NutritionLog {
  caloriesTarget: number;
  caloriesCurrent: number;
  proteinTargetG: number;
  proteinCurrentG: number;
  carbsTargetG: number;
  carbsCurrentG: number;
  fatTargetG: number;
  fatCurrentG: number;
  fiberCurrentG: number;
  waterTargetMl: number;
  waterCurrentMl: number;
  caffeineMg: number;
  meals: MealItem[];
}

export type NutritionPlan = NutritionLog;

export interface SleepMetrics {
  durationHours: number;
  bedTime: string;
  wakeTime: string;
  consistencyPercent: number;
  deepSleepPercent: number;
  remSleepPercent: number;
  lightSleepPercent: number;
  awakeMinutes: number;
  restingHeartRateBpm: number;
  hrvMs: number;
  recoveryScore: number;
}

export interface HabitItem {
  id: string;
  title: string;
  category:
    | "Hydration"
    | "Sleep"
    | "Nutrition"
    | "Training"
    | "Mind"
    | "HEALTH"
    | "RECOVERY"
    | "DISCIPLINE";
  streakDays: number;
  targetDaily?: string;
  targetDaysWeek?: number;
  historyLast7Days?: boolean[];
  historyWeek?: boolean[];
  todayCompleted?: boolean;
  completedToday?: boolean;
}

export interface GoalItem {
  id: string;
  type: "BODY" | "PERFORMANCE" | "STRENGTH" | "HEALTH" | "HABITS";
  title: string;
  currentValue: string;
  targetValue: string;
  progressPercent: number;
  deadline: string;
  metric: string;
}

export interface DataCorrelation {
  id: string;
  title: string;
  variableA: string;
  variableB: string;
  coefficient: number; // -1.0 to 1.0
  insight: string;
  tag: "HIGH_CONFIDENCE" | "MODERATE" | "OBSERVATION";
}

export interface HealthRecord {
  id: string;
  date: string;
  type: "Exame Laboratorial" | "Consulta Médica" | "Vacinação" | "Check-up Cardiológico";
  provider: string;
  notes: string;
  biomarkers?: {
    name: string;
    value: string;
    reference: string;
    status?: "optimal" | "borderline" | "abnormal";
  }[];
  fileAttached?: string;
}

export interface SecuritySettings {
  pinHash: string; // SHA-256 hash do PIN do usuário
  hasPinSet: boolean;
  isLocked: boolean;
  autoLockMinutes: number; // 0 = desligado, 5, 15, 30
  stealthMode: boolean; // Oculta métricas biométricas sensíveis na tela
  stealthModeActive?: boolean;
  lgpdConsentAccepted: boolean;
  consentTimestamp?: string;
  vaultEncryptionEnabled: boolean;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
}

export interface UserProfile {
  id: string;
  handle: string; // Ex: "OPERATOR_ALPHA"
  registeredAt: string;
  age: number;
  gender: "male" | "female";
  heightCm: number;
  initialWeightKg: number;
  weightKg?: number;
  targetWeightKg?: number;
  primaryGoal: "STRENGTH" | "HYPERTROPHY" | "ENDURANCE" | "RECOMPOSITION" | "HEALTH_LONGEVITY";
  activityLevel: "SEDENTARY" | "MODERATE" | "HIGH" | "ATHLETE";
  name?: string;
  email?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  handle: string;
  name: string;
  passwordHash: string;
  passwordSalt: string;
  pinHash: string;
  recoveryKey: string;
  twoFactorEnabled: boolean;
  twoFactorSecret: string;
  createdAt: string;
  lastLoginAt: string;
  failedLoginAttempts: number;
  lockedUntil: number | null;
  profile: UserProfile;
  securitySettings: SecuritySettings;
}

export interface AuthSession {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  rememberMe: boolean;
}

export interface LoginAuditLog {
  id: string;
  userId?: string;
  emailOrHandle: string;
  timestamp: string;
  status: "SUCCESS" | "FAILED" | "LOCKED" | "2FA_REQUIRED" | "2FA_FAILED" | "RECOVERY_USED" | "LOGOUT";
  device: string;
  ip: string;
  reason?: string;
}

export interface RegistrationFormData {
  fullName: string;
  handle: string;
  email: string;
  password: string;
  confirmPassword: string;
  pin: string;
  enableTwoFactor: boolean;
  // Biometrics
  age: number;
  gender: "male" | "female";
  heightCm: number;
  weightKg: number;
  targetWeightKg: number;
  bodyFatPercent: number;
  activityLevel: "SEDENTARY" | "MODERATE" | "HIGH" | "ATHLETE";
  // Circumferences (cm)
  waistCm: number;
  chestCm: number;
  armCm: number;
  thighCm: number;
  // Nutrition & Sleep
  dailyCalorieGoalKcal: number;
  dailyWaterGoalMl: number;
  typicalBedTime: string;
  typicalWakeTime: string;
  // Goals
  primaryGoal: "STRENGTH" | "HYPERTROPHY" | "ENDURANCE" | "RECOMPOSITION" | "HEALTH_LONGEVITY";
  // Legal
  lgpdConsentAccepted: boolean;
}

