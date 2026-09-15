import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { Navigation } from "./components/Navigation";
import { SystemStatusCard } from "./components/SystemStatusCard";
import { BodyModelViewer } from "./components/BodyModelViewer";
import { TrainingModule } from "./components/TrainingModule";
import { HealthModule } from "./components/HealthModule";
import { NutritionModule } from "./components/NutritionModule";
import { SleepRecoveryModule } from "./components/SleepRecoveryModule";
import { DataLabModule } from "./components/DataLabModule";
import { GLIntelligence } from "./components/GLIntelligence";
import { QuickActionsModal } from "./components/QuickActionsModal";
import { MonthlyReportModal } from "./components/MonthlyReportModal";
import { ExecutiveProposalModal } from "./components/ExecutiveProposalModal";
import { HealthAssessmentModal } from "./components/HealthAssessmentModal";
import { AppIntroScreen } from "./components/AppIntroScreen";
import { UserSettingsView, DEFAULT_DASHBOARD_CONFIG, DashboardCustomizationConfig } from "./components/UserSettingsView";

// Security & Lifecycle additions
import { AuthScreen } from "./components/AuthScreen";
import { UserOnboardingModal } from "./components/UserOnboardingModal";
import { SecurityLockScreen } from "./components/SecurityLockScreen";
import { SecurityCenterModal } from "./components/SecurityCenterModal";
import {
  STORAGE_KEYS,
  getUserProfile,
  getSecuritySettings,
  saveSecuritySettings,
  getAuthenticatedUser,
  setActiveSession,
  getUserVaultItem,
  setUserVaultItem,
  purgeCurrentUserVault,
  purgeVaultData,
  generateVaultExport,
  generateEncryptedVaultExport,
  logAuditEvent,
} from "./utils/security";
import {
  cleanNutrition,
  cleanSleep,
  zeroSystemStatus,
  createInitialCleanBodyMetrics,
} from "./data/emptyState";

import {
  NavigationTab,
  UserProfile,
  SecuritySettings,
  WorkoutSession,
  CardioSession,
  HabitItem,
  GoalItem,
  HealthRecord,
  SleepMetrics,
  NutritionPlan,
  MealItem,
  AuthUser,
  SystemStatusScores,
  MoodLog,
} from "./types";
import {
  Activity,
  Dumbbell,
  UserCheck,
  Utensils,
  ArrowRight,
  Flame,
  Sparkles,
  Shield,
  EyeOff,
  Lock,
} from "lucide-react";

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>("home");
  const [healthSubTab, setHealthSubTab] = useState<"nutricao" | "hidratacao" | "sono" | "humor">("nutricao");
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState<boolean>(false);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [isDossierOpen, setIsDossierOpen] = useState<boolean>(false);
  const [isSecurityCenterOpen, setIsSecurityCenterOpen] = useState<boolean>(false);
  const [isAssessmentOpen, setIsAssessmentOpen] = useState<boolean>(false);

  // Authentication & Operator Session Lifecycle
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => getAuthenticatedUser());
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const auth = getAuthenticatedUser();
    return auth ? auth.profile : getUserProfile();
  });
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings | null>(() => {
    const auth = getAuthenticatedUser();
    return auth ? auth.securitySettings : getSecuritySettings();
  });
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const auth = getAuthenticatedUser();
    if (!auth) return false;
    return auth.securitySettings?.hasPinSet ?? false;
  });
  const [stealthMode, setStealthMode] = useState<boolean>(() => {
    const auth = getAuthenticatedUser();
    return auth?.securitySettings?.stealthMode ?? false;
  });

  // Guest / Unauthenticated Navigation ("intro" landing screen vs "auth" login/register)
  const [guestScreen, setGuestScreen] = useState<"intro" | "auth">("intro");
  const [initialAuthTab, setInitialAuthTab] = useState<"login" | "register">("login");

  // Core Data States - Scoped per User Vault
  const [systemStatus, setSystemStatus] = useState<SystemStatusScores>(() => {
    const auth = getAuthenticatedUser();
    if (auth) {
      return getUserVaultItem(auth.id, "system_status", zeroSystemStatus);
    }
    const saved = localStorage.getItem(STORAGE_KEYS.SYSTEM_STATUS);
    return saved ? JSON.parse(saved) : zeroSystemStatus;
  });

  const [bodyMetrics, setBodyMetrics] = useState(() => {
    const auth = getAuthenticatedUser();
    if (auth) {
      return getUserVaultItem(
        auth.id,
        "body_metrics",
        createInitialCleanBodyMetrics(
          auth.profile.weightKg || 70,
          auth.profile.heightCm || 175,
          auth.profile.age || 28,
          auth.profile.gender || "male"
        )
      );
    }
    const saved = localStorage.getItem(STORAGE_KEYS.BODY_METRICS);
    if (saved) return JSON.parse(saved);
    const profile = getUserProfile();
    return createInitialCleanBodyMetrics(
      profile?.weightKg || 70,
      profile?.heightCm || 175,
      profile?.age || 28,
      profile?.gender || "male"
    );
  });

  const [workouts, setWorkouts] = useState<WorkoutSession[]>(() => {
    const auth = getAuthenticatedUser();
    if (auth) {
      return getUserVaultItem(auth.id, "workouts", []);
    }
    const saved = localStorage.getItem(STORAGE_KEYS.WORKOUTS);
    return saved ? JSON.parse(saved) : [];
  });

  const [cardioSessions, setCardioSessions] = useState<CardioSession[]>(() => {
    const auth = getAuthenticatedUser();
    if (auth) {
      return getUserVaultItem(auth.id, "cardio", []);
    }
    const saved = localStorage.getItem(STORAGE_KEYS.CARDIO);
    return saved ? JSON.parse(saved) : [];
  });

  const [nutrition, setNutrition] = useState<NutritionPlan>(() => {
    const auth = getAuthenticatedUser();
    if (auth) {
      return getUserVaultItem(auth.id, "nutrition", cleanNutrition);
    }
    const saved = localStorage.getItem(STORAGE_KEYS.NUTRITION);
    return saved ? JSON.parse(saved) : cleanNutrition;
  });

  const [sleep, setSleep] = useState<SleepMetrics>(() => {
    const auth = getAuthenticatedUser();
    if (auth) {
      return getUserVaultItem(auth.id, "sleep", cleanSleep);
    }
    const saved = localStorage.getItem(STORAGE_KEYS.SLEEP);
    return saved ? JSON.parse(saved) : cleanSleep;
  });

  const [habits, setHabits] = useState<HabitItem[]>(() => {
    const auth = getAuthenticatedUser();
    if (auth) {
      return getUserVaultItem(auth.id, "habits", []);
    }
    const saved = localStorage.getItem(STORAGE_KEYS.HABITS);
    return saved ? JSON.parse(saved) : [];
  });

  const [goals, setGoals] = useState<GoalItem[]>(() => {
    const auth = getAuthenticatedUser();
    if (auth) {
      return getUserVaultItem(auth.id, "goals", []);
    }
    const saved = localStorage.getItem(STORAGE_KEYS.GOALS);
    return saved ? JSON.parse(saved) : [];
  });

  const [healthTimeline, setHealthTimeline] = useState<HealthRecord[]>(() => {
    const auth = getAuthenticatedUser();
    if (auth) {
      return getUserVaultItem(auth.id, "health_timeline", []);
    }
    const saved = localStorage.getItem(STORAGE_KEYS.HEALTH_TIMELINE);
    return saved ? JSON.parse(saved) : [];
  });

  const [moodLogs, setMoodLogs] = useState<MoodLog[]>(() => {
    const auth = getAuthenticatedUser();
    if (auth) {
      return getUserVaultItem(auth.id, "mood_logs", []);
    }
    const saved = localStorage.getItem("gymlabs_mood_logs");
    return saved ? JSON.parse(saved) : [];
  });

  const [dashboardConfig, setDashboardConfig] = useState<DashboardCustomizationConfig>(() => {
    const auth = getAuthenticatedUser();
    if (auth) {
      return getUserVaultItem(auth.id, "dashboard_config", DEFAULT_DASHBOARD_CONFIG);
    }
    const saved = localStorage.getItem("gymlabs_dashboard_config");
    return saved ? JSON.parse(saved) : DEFAULT_DASHBOARD_CONFIG;
  });

  useEffect(() => {
    if (authUser) {
      setUserVaultItem(authUser.id, "dashboard_config", dashboardConfig);
    } else if (userProfile) {
      localStorage.setItem("gymlabs_dashboard_config", JSON.stringify(dashboardConfig));
    }
  }, [dashboardConfig, authUser, userProfile]);

  useEffect(() => {
    if (authUser) {
      setUserVaultItem(authUser.id, "mood_logs", moodLogs);
    } else if (userProfile) {
      localStorage.setItem("gymlabs_mood_logs", JSON.stringify(moodLogs));
    }
  }, [moodLogs, authUser, userProfile]);

  // Keep state synced with scoped User Vault & localStorage
  useEffect(() => {
    if (authUser) {
      setUserVaultItem(authUser.id, "body_metrics", bodyMetrics);
    } else if (userProfile) {
      localStorage.setItem(STORAGE_KEYS.BODY_METRICS, JSON.stringify(bodyMetrics));
    }
  }, [bodyMetrics, authUser, userProfile]);

  useEffect(() => {
    if (authUser) {
      setUserVaultItem(authUser.id, "workouts", workouts);
    } else if (userProfile) {
      localStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(workouts));
    }
  }, [workouts, authUser, userProfile]);

  useEffect(() => {
    if (authUser) {
      setUserVaultItem(authUser.id, "cardio", cardioSessions);
    } else if (userProfile) {
      localStorage.setItem(STORAGE_KEYS.CARDIO, JSON.stringify(cardioSessions));
    }
  }, [cardioSessions, authUser, userProfile]);

  useEffect(() => {
    if (authUser) {
      setUserVaultItem(authUser.id, "nutrition", nutrition);
    } else if (userProfile) {
      localStorage.setItem(STORAGE_KEYS.NUTRITION, JSON.stringify(nutrition));
    }
  }, [nutrition, authUser, userProfile]);

  useEffect(() => {
    if (authUser) {
      setUserVaultItem(authUser.id, "sleep", sleep);
    } else if (userProfile) {
      localStorage.setItem(STORAGE_KEYS.SLEEP, JSON.stringify(sleep));
    }
  }, [sleep, authUser, userProfile]);

  useEffect(() => {
    if (authUser) {
      setUserVaultItem(authUser.id, "habits", habits);
    } else if (userProfile) {
      localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
    }
  }, [habits, authUser, userProfile]);

  useEffect(() => {
    if (authUser) {
      setUserVaultItem(authUser.id, "goals", goals);
    } else if (userProfile) {
      localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
    }
  }, [goals, authUser, userProfile]);

  useEffect(() => {
    if (authUser) {
      setUserVaultItem(authUser.id, "health_timeline", healthTimeline);
    } else if (userProfile) {
      localStorage.setItem(STORAGE_KEYS.HEALTH_TIMELINE, JSON.stringify(healthTimeline));
    }
  }, [healthTimeline, authUser, userProfile]);

  useEffect(() => {
    if (authUser) {
      setUserVaultItem(authUser.id, "system_status", systemStatus);
    } else if (userProfile) {
      localStorage.setItem(STORAGE_KEYS.SYSTEM_STATUS, JSON.stringify(systemStatus));
    }
  }, [systemStatus, authUser, userProfile]);

  // Inactivity Auto-Lock Enclave Timer
  useEffect(() => {
    if (!securitySettings || securitySettings.autoLockMinutes <= 0 || isLocked || !authUser) {
      return;
    }

    const timeoutMs = securitySettings.autoLockMinutes * 60 * 1000;
    let timer = setTimeout(() => {
      setIsLocked(true);
    }, timeoutMs);

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setIsLocked(true);
      }, timeoutMs);
    };

    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);
    window.addEventListener("touchstart", resetTimer);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("touchstart", resetTimer);
    };
  }, [securitySettings?.autoLockMinutes, isLocked, authUser]);

  // Recalculate system index as data arrives
  const recalculateSystemIndex = (
    wCount: number,
    cKcal: number,
    sHours: number,
    hCompleted: number,
    hTotal: number
  ) => {
    if (wCount === 0 && cKcal === 0 && sHours === 0) {
      setSystemStatus(zeroSystemStatus);
      return;
    }

    const trainingScore = Math.min(100, Math.round(wCount * 25));
    const nutritionScore = cKcal > 0 ? Math.min(100, Math.round((cKcal / 2400) * 85)) : 50;
    const sleepScore = sHours > 0 ? Math.min(100, Math.round((sHours / 8) * 90)) : 50;
    const consistencyScore = hTotal > 0 ? Math.round((hCompleted / hTotal) * 100) : 50;

    const overall = Math.round(
      trainingScore * 0.3 + nutritionScore * 0.25 + sleepScore * 0.25 + consistencyScore * 0.2
    );

    setSystemStatus({
      overall,
      training: trainingScore,
      nutrition: nutritionScore,
      sleep: sleepScore,
      recovery: sleep.recoveryScore || 60,
      activity: Math.min(100, Math.round(wCount * 20 + cardioSessions.length * 20)),
      consistency: consistencyScore,
    });
  };

  // Authentication & Login Handler
  const handleAuthenticated = (user: AuthUser) => {
    setAuthUser(user);
    setUserProfile(user.profile);
    setSecuritySettings(user.securitySettings);
    setStealthMode(user.securitySettings.stealthMode);
    setIsLocked(false);

    // Load or initialize scoped metrics
    const userBody = getUserVaultItem(
      user.id,
      "body_metrics",
      createInitialCleanBodyMetrics(
        user.profile.weightKg || 70,
        user.profile.heightCm || 175,
        user.profile.age || 28,
        user.profile.gender || "male"
      )
    );
    setBodyMetrics(userBody);

    const userStatus = getUserVaultItem(user.id, "system_status", zeroSystemStatus);
    setSystemStatus(userStatus);

    const userWorkouts = getUserVaultItem<WorkoutSession[]>(user.id, "workouts", []);
    setWorkouts(userWorkouts);

    const userCardio = getUserVaultItem<CardioSession[]>(user.id, "cardio", []);
    setCardioSessions(userCardio);

    const userNutrition = getUserVaultItem<NutritionPlan>(user.id, "nutrition", cleanNutrition);
    setNutrition(userNutrition);

    const userSleep = getUserVaultItem<SleepMetrics>(user.id, "sleep", cleanSleep);
    setSleep(userSleep);

    const userHabits = getUserVaultItem<HabitItem[]>(user.id, "habits", []);
    setHabits(userHabits);

    const userGoals = getUserVaultItem<GoalItem[]>(user.id, "goals", []);
    setGoals(userGoals);

    const userHealthTimeline = getUserVaultItem<HealthRecord[]>(user.id, "health_timeline", []);
    setHealthTimeline(userHealthTimeline);
  };

  // Logout Handler
  const handleLogout = () => {
    if (authUser) {
      logAuditEvent({
        userId: authUser.id,
        emailOrHandle: authUser.email,
        status: "LOGOUT",
        reason: "MANUAL_OPERATOR_LOGOUT",
      });
    }
    setActiveSession(null);
    setAuthUser(null);
    setUserProfile(null);
    setIsSecurityCenterOpen(false);
    setIsLocked(false);
  };

  // Purge Account & Reset to Factory
  const handlePurgeVault = () => {
    if (authUser) {
      purgeCurrentUserVault(authUser.id);
    } else {
      purgeVaultData();
    }
    setAuthUser(null);
    setUserProfile(null);
    setIsSecurityCenterOpen(false);
    setIsLocked(false);
  };

  // Vault Export Handler (LGPD Portability)
  const handleExportVault = () => {
    generateVaultExport({
      profile: userProfile,
      security: securitySettings,
      systemStatus,
      bodyMetrics,
      workouts,
      cardioSessions,
      nutrition,
      sleep,
      habits,
      goals,
      healthTimeline,
    });
  };

  // Encrypted Vault Export Handler (AES-GCM 256-bit + PBKDF2)
  const handleExportEncryptedVault = async (passphrase: string) => {
    await generateEncryptedVaultExport(
      {
        profile: userProfile,
        security: securitySettings,
        systemStatus,
        bodyMetrics,
        workouts,
        cardioSessions,
        nutrition,
        sleep,
        habits,
        goals,
        healthTimeline,
      },
      passphrase
    );
  };

  // Onboarding Complete handler (legacy fallback)
  const handleOnboardingComplete = (profile: UserProfile, settings: SecuritySettings) => {
    setUserProfile(profile);
    setSecuritySettings(settings);
    setStealthMode(settings.stealthModeActive);
    setIsLocked(false);

    // Initialize clean metrics calibrated to user's biological baseline
    const cleanBody = createInitialCleanBodyMetrics(
      profile.weightKg,
      profile.heightCm,
      profile.age,
      profile.gender
    );
    setBodyMetrics(cleanBody);
    setSystemStatus(zeroSystemStatus);
    setWorkouts([]);
    setCardioSessions([]);
    setNutrition(cleanNutrition);
    setSleep(cleanSleep);
    setHabits([]);
    setGoals([]);
    setHealthTimeline([]);
  };

  // Data update handlers
  const handleAddWorkout = (newWorkout: WorkoutSession) => {
    setWorkouts((prev) => {
      const updated = [newWorkout, ...prev];
      recalculateSystemIndex(
        updated.length,
        nutrition.caloriesCurrent,
        sleep.durationHours,
        habits.filter((h) => h.completedToday).length,
        habits.length
      );
      return updated;
    });
  };

  const handleAddCardio = (session: CardioSession) => {
    setCardioSessions((prev) => [session, ...prev]);
  };

  const handleAddMeal = (meal: MealItem) => {
    setNutrition((prev) => {
      const updatedCalories = prev.caloriesCurrent + meal.calories;
      const updated: NutritionPlan = {
        ...prev,
        caloriesCurrent: updatedCalories,
        proteinCurrentG: prev.proteinCurrentG + meal.proteinG,
        carbsCurrentG: prev.carbsCurrentG + meal.carbsG,
        fatCurrentG: prev.fatCurrentG + meal.fatG,
        meals: [meal, ...prev.meals],
      };
      recalculateSystemIndex(
        workouts.length,
        updatedCalories,
        sleep.durationHours,
        habits.filter((h) => h.completedToday).length,
        habits.length
      );
      return updated;
    });
  };

  const handleUpdateSleep = (newSleep: SleepMetrics) => {
    setSleep(newSleep);
    recalculateSystemIndex(
      workouts.length,
      nutrition.caloriesCurrent,
      newSleep.durationHours,
      habits.filter((h) => h.completedToday).length,
      habits.length
    );
  };

  const handleAddHabit = (newHabit: HabitItem) => {
    setHabits((prev) => [...prev, newHabit]);
  };

  const handleToggleHabit = (id: string) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id === id) {
          const nextState = !h.completedToday;
          return {
            ...h,
            completedToday: nextState,
            streakDays: nextState ? h.streakDays + 1 : Math.max(0, h.streakDays - 1),
          };
        }
        return h;
      })
    );
  };

  const handleAddGoal = (newGoal: GoalItem) => {
    setGoals((prev) => [...prev, newGoal]);
  };

  const handleAddHealthRecord = (record: HealthRecord) => {
    setHealthTimeline((prev) => [record, ...prev]);
  };

  // Quick Action Handlers
  const handleLogWeight = (weight: number, bodyFat?: number) => {
    setBodyMetrics((prev: any) => ({
      ...prev,
      weightKg: weight,
      bodyFatPercent: bodyFat !== undefined ? bodyFat : prev.bodyFatPercent,
    }));
  };

  const handleLogWater = (amountMl: number) => {
    setNutrition((prev) => ({
      ...prev,
      waterCurrentMl: prev.waterCurrentMl + amountMl,
    }));
  };

  const handleLogSleep = (hours: number) => {
    const updated: SleepMetrics = {
      ...sleep,
      durationHours: hours,
      recoveryScore: Math.min(100, Math.round(hours * 11.5)),
    };
    handleUpdateSleep(updated);
  };

  const handleLogCheckIn = (mood: number, energy: number, stress: number) => {
    setSystemStatus((prev: any) => ({
      ...prev,
      recovery: Math.min(100, Math.round(energy * 10)),
      overall: Math.min(100, Math.round((prev.overall + energy * 8) / 2)),
    }));
  };

  const handleLogMood = (entry: MoodLog) => {
    setMoodLogs((prev) => [entry, ...prev]);
    setSystemStatus((prev: any) => ({
      ...prev,
      recovery: entry.readinessScore || prev.recovery,
      overall: Math.min(100, Math.round((prev.overall + (entry.readinessScore || 75)) / 2)),
    }));
  };

  const handleUpdateNutritionGoals = (goals: {
    caloriesTarget: number;
    proteinTargetG: number;
    carbsTargetG: number;
    fatTargetG: number;
    waterTargetMl: number;
  }) => {
    setNutrition((prev) => ({
      ...prev,
      ...goals,
    }));
  };

  const handleApplyAssessmentPlans = (
    goals: {
      caloriesTarget: number;
      proteinTargetG: number;
      carbsTargetG: number;
      fatTargetG: number;
      waterTargetMl: number;
    },
    suggestedWorkouts: WorkoutSession[]
  ) => {
    setNutrition((prev) => ({
      ...prev,
      ...goals,
    }));
    if (suggestedWorkouts && suggestedWorkouts.length > 0) {
      setWorkouts((prev) => [...suggestedWorkouts, ...prev]);
    }
  };

  // Telemetry context object for Gemini AI queries
  const telemetryContext = {
    systemStatus,
    bodyMetrics: {
      weightKg: stealthMode ? "HIDDEN_BY_SECURITY" : bodyMetrics.weightKg,
      bodyFatPercent: stealthMode ? "HIDDEN_BY_SECURITY" : bodyMetrics.bodyFatPercent,
      evolution: bodyMetrics.evolution,
    },
    nutrition: {
      caloriesCurrent: nutrition.caloriesCurrent,
      caloriesTarget: nutrition.caloriesTarget,
      proteinCurrentG: nutrition.proteinCurrentG,
      waterCurrentMl: nutrition.waterCurrentMl,
    },
    sleep: {
      durationHours: sleep.durationHours,
      hrvMs: sleep.hrvMs,
      restingHeartRateBpm: sleep.restingHeartRateBpm,
      recoveryScore: sleep.recoveryScore,
    },
    workoutsCount: workouts.length,
    cardioVolumeKm: cardioSessions.reduce((acc, c) => acc + c.distanceKm, 0),
    habitsConsistency: `${
      habits.length > 0
        ? Math.round((habits.filter((h) => h.completedToday).length / habits.length) * 100)
        : 0
    }%`,
  };

  // 1. GATEWAY // If no authenticated user session, present Intro Screen or Login/Registration Center
  if (!authUser || !userProfile) {
    if (guestScreen === "intro") {
      return (
        <AppIntroScreen
          onNavigateToAuth={(tab) => {
            setInitialAuthTab(tab);
            setGuestScreen("auth");
          }}
        />
      );
    }
    return (
      <AuthScreen
        onAuthenticated={handleAuthenticated}
        initialTab={initialAuthTab}
        onBackToIntro={() => setGuestScreen("intro")}
      />
    );
  }

  // 2. VAULT LOCK // If vault is locked by security PIN, present lock screen
  if (isLocked) {
    return (
      <SecurityLockScreen
        isLocked={isLocked}
        pinHash={securitySettings?.pinHash || ""}
        onUnlock={() => setIsLocked(false)}
        operatorHandle={userProfile.handle}
        onLogout={handleLogout}
      />
    );
  }

  const renderContent = () => {
    switch (currentTab) {
      case "home":
        return (
          <div className="space-y-6">
            {/* System Status Core 0-100 Gauge */}
            {dashboardConfig.showSystemStatus && (
              <SystemStatusCard scores={systemStatus} />
            )}

            {/* Section 01 // Biomechanical Avatar & Body Model directly on Dashboard */}
            {dashboardConfig.showBody3D && (
              <div className="space-y-2">
                <BodyModelViewer
                  bodyMetrics={bodyMetrics}
                  userProfile={userProfile}
                  onUpdateBodyMetrics={(updated) => {
                    setBodyMetrics(updated);
                    if (authUser) {
                      setUserVaultItem(authUser.id, "body_metrics", updated);
                    }
                  }}
                  stealthMode={stealthMode}
                />
              </div>
            )}

            {/* Section 02 // Telemetry Quad */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-hud tracking-widest text-zinc-400 uppercase">
                <span>[ 02 // QUADRANTE DE TELEMETRIA ]</span>
                <span className="text-zinc-500">MONITORAMENTO CONTÍNUO</span>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Metric 1: Weight */}
                <div
                  onClick={() => setIsQuickActionOpen(true)}
                  className="bg-black hover:bg-zinc-950 border border-zinc-800 hover:border-zinc-500 p-3.5 cursor-pointer transition-all relative group"
                >
                  <div className="flex items-center justify-between text-zinc-500 mb-2">
                    <span className="text-[10px] font-hud uppercase tracking-widest text-zinc-400">
                      01. PESO CORPORAL
                    </span>
                    <UserCheck className="w-3.5 h-3.5 text-zinc-300" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-4xl font-bold font-mono text-white tracking-tight">
                      {stealthMode ? "••••" : bodyMetrics.weightKg}
                    </span>
                    <span className="text-xs font-hud text-zinc-500">KG</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-zinc-900 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-white font-bold">
                      {bodyMetrics.weightKg > 0 ? "CALIBRADO" : "PENDENTE"}
                    </span>
                    <span className="text-zinc-400">
                      {stealthMode
                        ? "••••"
                        : bodyMetrics.bodyFatPercent > 0
                        ? `${bodyMetrics.bodyFatPercent}% FAT`
                        : "AUTO-ESTIMADO"}
                    </span>
                  </div>
                </div>

                {/* Metric 2: Training */}
                <div
                  onClick={() => setCurrentTab("train")}
                  className="bg-black hover:bg-zinc-950 border border-zinc-800 hover:border-zinc-500 p-3.5 cursor-pointer transition-all relative group"
                >
                  <div className="flex items-center justify-between text-zinc-500 mb-2">
                    <span className="text-[10px] font-hud uppercase tracking-widest text-zinc-400">
                      02. TREINOS
                    </span>
                    <Dumbbell className="w-3.5 h-3.5 text-zinc-300" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-4xl font-bold font-mono text-white tracking-tight">
                      {workouts.length}
                    </span>
                    <span className="text-xs font-hud text-zinc-500">SESSÕES</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-zinc-900 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-zinc-200 font-bold">
                      {workouts.length > 0
                        ? `${workouts.reduce((acc, w) => acc + (w.totalVolumeKg || 0), 0).toLocaleString()} KG`
                        : "[ ZERO ]"}
                    </span>
                    <span className="text-zinc-400">
                      {workouts.length > 0 ? "VER REGISTROS" : "SEM TREINOS"}
                    </span>
                  </div>
                </div>

                {/* Metric 3: HRV & Recovery */}
                <div
                  onClick={() => {
                    setHealthSubTab("sono");
                    setCurrentTab("health");
                  }}
                  className="bg-black hover:bg-zinc-950 border border-zinc-800 hover:border-zinc-500 p-3.5 cursor-pointer transition-all relative group"
                >
                  <div className="flex items-center justify-between text-zinc-500 mb-2">
                    <span className="text-[10px] font-hud uppercase tracking-widest text-zinc-400">
                      03. RECUPERAÇÃO & SONO
                    </span>
                    <Activity className="w-3.5 h-3.5 text-zinc-300" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-4xl font-bold font-mono text-white tracking-tight">
                      {sleep.recoveryScore}
                    </span>
                    <span className="text-xs font-hud text-zinc-500">/100</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-zinc-900 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-white font-bold">
                      HRV {sleep.hrvMs > 0 ? `${sleep.hrvMs} MS` : "--"}
                    </span>
                    <span className="text-zinc-400">
                      {sleep.durationHours}H DORMIDAS
                    </span>
                  </div>
                </div>

                {/* Metric 4: Nutrition */}
                <div
                  onClick={() => {
                    setHealthSubTab("nutricao");
                    setCurrentTab("health");
                  }}
                  className="bg-black hover:bg-zinc-950 border border-zinc-800 hover:border-zinc-500 p-3.5 cursor-pointer transition-all relative group"
                >
                  <div className="flex items-center justify-between text-zinc-500 mb-2">
                    <span className="text-[10px] font-hud uppercase tracking-widest text-zinc-400">
                      04. BALANÇO & NUTRIÇÃO
                    </span>
                    <Utensils className="w-3.5 h-3.5 text-zinc-300" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-4xl font-bold font-mono text-white tracking-tight">
                      {nutrition.caloriesCurrent}
                    </span>
                    <span className="text-xs font-hud text-zinc-500">
                      / {nutrition.caloriesTarget} KCAL
                    </span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-zinc-900 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-white font-bold">
                      {nutrition.proteinCurrentG}G PRO
                    </span>
                    <span className="text-zinc-400">{nutrition.waterCurrentMl} ML ÁGUA</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 03 // Habit Consistency Matrix */}
            <div className="border border-zinc-800 bg-black p-4 sm:p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-zinc-800 pb-2">
                <span className="text-xs font-hud font-bold text-zinc-300 tracking-wider flex items-center gap-2 uppercase">
                  <Flame className="w-4 h-4 text-zinc-300" />
                  [ 03 // CONSISTÊNCIA DE HÁBITOS ]
                </span>
                <div className="flex items-center gap-3 text-[11px] font-mono">
                  <span className="text-zinc-500">PROGRESSO:</span>
                  <span className="text-white font-bold">
                    {habits.filter((h) => h.completedToday).length} / {habits.length} CONCLUÍDOS
                  </span>
                </div>
              </div>

              {habits.length === 0 ? (
                <div className="border border-zinc-900 bg-zinc-950 p-6 text-center space-y-2">
                  <span className="text-xs text-zinc-500 font-mono block">
                    [ NENHUM HÁBITO CRIADO AINDA ]
                  </span>
                  <p className="text-xs text-zinc-400 font-mono max-w-sm mx-auto">
                    Crie hábitos diários no Data Lab para acompanhar sua consistência comportamental.
                  </p>
                  <button
                    onClick={() => setCurrentTab("lab")}
                    className="px-3 py-1.5 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-mono uppercase"
                  >
                    + CONFIGURAR NO DATA LAB
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {habits.map((habit) => (
                    <button
                      key={habit.id}
                      onClick={() => handleToggleHabit(habit.id)}
                      className={`p-3 border text-left flex flex-col justify-between gap-3 transition-all ${
                        habit.completedToday
                          ? "bg-zinc-950 border-white text-white"
                          : "bg-black border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white"
                      }`}
                    >
                      <div>
                        <span className="text-[9px] font-mono text-zinc-500 block uppercase mb-1">
                          HÁBITO
                        </span>
                        <span className="text-xs font-hud font-bold block leading-snug uppercase tracking-wide">
                          {habit.title}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-zinc-900 text-[10px] font-mono">
                        <span className="text-zinc-300 font-bold">{habit.streakDays} DIAS</span>
                        <span
                          className={`px-1.5 py-0.5 border text-[9px] font-mono ${
                            habit.completedToday
                              ? "bg-white text-black border-white font-bold"
                              : "border-zinc-800 text-zinc-600"
                          }`}
                        >
                          {habit.completedToday ? "[OK]" : "[PEND]"}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Section 04 // AI Intelligence Banner */}
            <div
              onClick={() => setCurrentTab("intelligence")}
              className="border-2 border-zinc-800 bg-black hover:bg-zinc-950 p-4 flex items-center justify-between gap-4 cursor-pointer transition-all group hover:border-zinc-500"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 border border-zinc-700 bg-zinc-900 flex items-center justify-center text-white shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-mono text-zinc-300 tracking-widest uppercase">
                      GYM LABS INTELLIGENCE
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">// IA BIOMÉTRICA</span>
                  </div>
                  <span className="text-xs sm:text-sm font-mono text-zinc-300 block">
                    "Analise meu balanço energético e prontidão fisiológica"
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-hud text-white uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                <span className="hidden sm:inline">CONSULTAR</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        );

      case "train":
        return (
          <TrainingModule
            workouts={workouts}
            cardioSessions={cardioSessions}
            onAddWorkout={handleAddWorkout}
            onAddCardio={handleAddCardio}
            onOpenAssessment={() => setIsAssessmentOpen(true)}
            userWeightKg={bodyMetrics.weightKg || userProfile?.weightKg || 75}
          />
        );

      case "health":
        return (
          <HealthModule
            nutrition={nutrition}
            sleep={sleep}
            moodLogs={moodLogs}
            onAddWater={handleLogWater}
            onAddMeal={handleAddMeal}
            onRemoveMeal={(mealId) => {
              setNutrition((prev) => {
                const targetMeal = prev.meals.find((m) => m.id === mealId);
                return {
                  ...prev,
                  meals: prev.meals.filter((m) => m.id !== mealId),
                  caloriesCurrent: Math.max(0, prev.caloriesCurrent - (targetMeal?.calories || 0)),
                  proteinCurrentG: Math.max(0, prev.proteinCurrentG - (targetMeal?.proteinG || 0)),
                  carbsCurrentG: Math.max(0, prev.carbsCurrentG - (targetMeal?.carbsG || 0)),
                  fatCurrentG: Math.max(0, prev.fatCurrentG - (targetMeal?.fatG || 0)),
                };
              });
            }}
            onUpdateNutritionGoals={handleUpdateNutritionGoals}
            onOpenAssessment={() => setIsAssessmentOpen(true)}
            onUpdateSleep={handleUpdateSleep}
            onLogMood={handleLogMood}
            defaultSubTab={healthSubTab}
            userWeightKg={bodyMetrics.weightKg || userProfile?.weightKg || 75}
          />
        );

      case "lab":
        return (
          <DataLabModule
            habits={habits}
            goals={goals}
            healthTimeline={healthTimeline}
            workouts={workouts}
            cardioSessions={cardioSessions}
            nutrition={nutrition}
            sleep={sleep}
            bodyMetrics={bodyMetrics}
            systemStatus={systemStatus}
            onToggleHabit={handleToggleHabit}
            onAddHabit={handleAddHabit}
            onAddGoal={handleAddGoal}
            onAddHealthRecord={handleAddHealthRecord}
            stealthMode={stealthMode}
          />
        );

      case "intelligence":
        return <GLIntelligence telemetryContext={telemetryContext} />;

      case "settings":
        return (
          <UserSettingsView
            userProfile={userProfile}
            authUser={authUser}
            bodyMetrics={bodyMetrics}
            dashboardConfig={dashboardConfig}
            onOpenSecurityCenter={() => setIsSecurityCenterOpen(true)}
            onUpdateProfile={(updatedProfile) => {
              setUserProfile(updatedProfile);
              if (authUser) {
                setAuthUser({
                  ...authUser,
                  profile: updatedProfile,
                });
              }
            }}
            onUpdateBodyMetrics={(updatedMetrics) => {
              setBodyMetrics(updatedMetrics);
              if (authUser) {
                setUserVaultItem(authUser.id, "body_metrics", updatedMetrics);
              }
            }}
            onUpdateDashboardConfig={(newConfig) => {
              setDashboardConfig(newConfig);
              if (authUser) {
                setUserVaultItem(authUser.id, "dashboard_config", newConfig);
              }
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-mono selection:bg-zinc-700 selection:text-white">
      {/* Top Header */}
      <Header
        systemStatus={systemStatus}
        isMobileFrame={isMobileFrame}
        onToggleFrame={() => setIsMobileFrame(!isMobileFrame)}
        onOpenQuickAction={() => setIsQuickActionOpen(true)}
        onOpenReport={() => setIsReportOpen(true)}
        onOpenDossier={() => setIsDossierOpen(true)}
        onOpenSecurityCenter={() => setIsSecurityCenterOpen(true)}
        isStealthActive={stealthMode}
        userHandle={userProfile.handle}
        onLogout={handleLogout}
        onOpenSettings={() => setCurrentTab("settings")}
      />

      {/* Main Layout Container */}
      <main className="flex-1 flex justify-center p-2 sm:p-6 pb-24">
        {isMobileFrame ? (
          /* Mobile Phone Frame Mockup */
          <div className="w-full max-w-[420px] bg-black border border-zinc-800 rounded-lg shadow-2xl flex flex-col overflow-hidden relative min-h-[760px]">
            {/* Phone Status Bar */}
            <div className="w-full px-4 py-2 flex items-center justify-between text-[10px] font-mono text-zinc-400 border-b border-zinc-800 bg-[#050505]">
              <span className="font-bold text-white">09:41:22</span>
              <div className="px-2 py-0.5 border border-zinc-800 bg-black text-[9px] text-zinc-300 font-hud tracking-wider">
                GYM LABS // MOBILE
              </div>
              <div className="flex items-center gap-1.5 text-[9px] text-zinc-400">
                <span>5G+</span>
                <span className="text-zinc-300">100%</span>
              </div>
            </div>

            {/* Mobile Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">{renderContent()}</div>

            {/* Mobile Bottom Navigation */}
            <Navigation currentTab={currentTab} onSelectTab={setCurrentTab} />
          </div>
        ) : (
          /* Full Lab Desk Wide Mode */
          <div className="w-full max-w-6xl space-y-6">{renderContent()}</div>
        )}
      </main>

      {/* Sticky Bottom Nav on Desk Mode */}
      {!isMobileFrame && (
        <div className="fixed bottom-0 left-0 right-0 z-30 flex justify-center border-t border-zinc-800 bg-black/95 backdrop-blur-md">
          <div className="w-full max-w-3xl">
            <Navigation currentTab={currentTab} onSelectTab={setCurrentTab} />
          </div>
        </div>
      )}

      {/* Modals */}
      <QuickActionsModal
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
        onLogWeight={handleLogWeight}
        onLogWater={handleLogWater}
        onLogSleep={handleLogSleep}
        onLogCheckIn={handleLogCheckIn}
      />

      <MonthlyReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} />

      <ExecutiveProposalModal isOpen={isDossierOpen} onClose={() => setIsDossierOpen(false)} />

      <HealthAssessmentModal
        isOpen={isAssessmentOpen}
        onClose={() => setIsAssessmentOpen(false)}
        userProfile={
          userProfile || {
            id: "default",
            name: "Atleta",
            handle: "atleta",
            age: 26,
            gender: "male",
            heightCm: 175,
            weightKg: 75,
            targetWeightKg: 75,
            bodyFatPercent: 15,
            role: "Athlete",
            clearanceLevel: "LEVEL_1",
          }
        }
        currentNutrition={nutrition}
        onApplyPlans={handleApplyAssessmentPlans}
      />

      {/* Security Center Modal */}
      {isSecurityCenterOpen && (
        <SecurityCenterModal
          isOpen={isSecurityCenterOpen}
          onClose={() => setIsSecurityCenterOpen(false)}
          security={
            securitySettings || {
              hasPinSet: false,
              pinHash: "",
              autoLockMinutes: 15,
              stealthMode: stealthMode,
              twoFactorEnabled: false,
            }
          }
          userProfile={userProfile}
          authUser={authUser}
          onUpdateSecurity={(newSec) => {
            setSecuritySettings(newSec);
            setStealthMode(newSec.stealthMode);
            saveSecuritySettings(newSec);
          }}
          onExportVault={handleExportVault}
          onExportEncryptedVault={handleExportEncryptedVault}
          onPurgeVault={handlePurgeVault}
          onLockTerminalNow={() => {
            setIsSecurityCenterOpen(false);
            setIsLocked(true);
          }}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}
