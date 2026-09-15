import React, { useState, useEffect } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  Key,
  Eye,
  EyeOff,
  User,
  Mail,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Fingerprint,
  Activity,
  Flame,
  Moon,
  Ruler,
  Copy,
  Check,
  Sparkles,
  HelpCircle,
  Calculator,
} from "lucide-react";
import {
  calculatePasswordStrength,
  generateCryptographicSalt,
  generateRecoveryKey,
  generateSessionToken,
  getRateLimitStatus,
  hashPassword,
  hashPin,
  logAuditEvent,
  recordFailedLoginAttempt,
  clearFailedLoginAttempts,
  getAllUsers,
  saveAllUsers,
  setActiveSession,
  sanitizeInput,
  setUserVaultItem,
  generateTotpSecret,
  verifyTotpToken,
  loginViaServer,
  registerViaServer,
} from "../utils/security";
import { AuthUser, AuthSession, RegistrationFormData, UserProfile, SecuritySettings } from "../types";
import { createInitialCleanBodyMetrics, cleanNutrition, cleanSleep } from "../data/emptyState";

interface AuthScreenProps {
  onAuthenticated: (user: AuthUser) => void;
  initialTab?: "login" | "register";
  onBackToIntro?: () => void;
}

// Generate codename automatically from full name
function generateCodename(fullName: string): string {
  const clean = fullName
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "");
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "atleta";
  if (parts.length === 1) return parts[0];
  return `${parts[0]}.${parts[parts.length - 1]}`;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onAuthenticated,
  initialTab = "login",
  onBackToIntro,
}) => {
  // Navigation tabs: ONLY login or register (recovery is embedded directly in login)
  const [activeTab, setActiveTab] = useState<"login" | "register">(initialTab);
  const [isRecoveringPassword, setIsRecoveringPassword] = useState(false);

  // LOGIN STATE
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // 2FA STATE
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [pendingUser, setPendingUser] = useState<AuthUser | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [useBackupKey, setUseBackupKey] = useState(false);
  const [backupKeyInput, setBackupKeyInput] = useState("");

  // RATE LIMIT / LOCKOUT
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  // REGISTRATION FORM STATE (Multi-step)
  const [regStep, setRegStep] = useState<1 | 2 | 3 | 4>(1);
  const [knowsNutritionGoals, setKnowsNutritionGoals] = useState(false);
  const [hasCustomMeasurements, setHasCustomMeasurements] = useState(false);

  const [regData, setRegData] = useState<RegistrationFormData>({
    fullName: "",
    handle: "",
    email: "",
    password: "",
    confirmPassword: "",
    pin: "",
    enableTwoFactor: false,
    // Biometrics (Unset until user provides real physical values)
    age: 0,
    gender: "male",
    heightCm: 0,
    weightKg: 0,
    targetWeightKg: 0,
    bodyFatPercent: 0,
    activityLevel: "MODERATE",
    // Circumferences (Optional - initially 0/empty)
    waistCm: 0,
    chestCm: 0,
    armCm: 0,
    thighCm: 0,
    // Nutrition & Sleep
    dailyCalorieGoalKcal: 0,
    dailyWaterGoalMl: 0,
    typicalBedTime: "23:00",
    typicalWakeTime: "07:00",
    // Goals
    primaryGoal: "HYPERTROPHY",
    // Legal
    lgpdConsentAccepted: false,
  });

  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regError, setRegError] = useState("");
  const [generatedRecoveryKey, setGeneratedRecoveryKey] = useState("");
  const [copiedKey, setCopiedKey] = useState(false);
  const [regLoading, setRegLoading] = useState(false);

  // RECOVERY STATE
  const [recoveryIdentifier, setRecoveryIdentifier] = useState("");
  const [recoveryKey, setRecoveryKey] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [recoverySuccess, setRecoverySuccess] = useState(false);
  const [recoveryError, setRecoveryError] = useState("");
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  // Password strength meter
  const regPasswordStrength = calculatePasswordStrength(regData.password);
  const newPasswordStrength = calculatePasswordStrength(newPassword);

  // Check rate limit on input change
  useEffect(() => {
    if (!loginIdentifier) return;
    const status = getRateLimitStatus(loginIdentifier);
    if (status.isLocked) {
      setLockoutRemaining(status.remainingSeconds);
    }
  }, [loginIdentifier]);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const timer = setInterval(() => {
      setLockoutRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutRemaining]);

  // Generate recovery key when reaching Step 4
  useEffect(() => {
    if (regStep === 4 && !generatedRecoveryKey) {
      setGeneratedRecoveryKey(generateRecoveryKey());
    }
  }, [regStep, generatedRecoveryKey]);

  // Automatic calculation of nutrition and water goals (strictly when real biometrics are entered)
  useEffect(() => {
    if (knowsNutritionGoals) return; // User opted to answer custom questions
    if (!regData.weightKg || !regData.heightCm || !regData.age) return;

    // Mifflin-St Jeor formula
    let bmr = 10 * regData.weightKg + 6.25 * regData.heightCm - 5 * regData.age;
    bmr += regData.gender === "male" ? 5 : -161;

    const activityMultipliers: Record<string, number> = {
      SEDENTARY: 1.2,
      MODERATE: 1.45,
      HIGH: 1.65,
      ATHLETE: 1.85,
    };
    const factor = activityMultipliers[regData.activityLevel] || 1.45;
    let tdee = Math.round(bmr * factor);

    if (regData.primaryGoal === "HYPERTROPHY" || regData.primaryGoal === "STRENGTH") {
      tdee += 350; // Superávit saudável
    } else if (regData.primaryGoal === "RECOMPOSITION") {
      tdee = Math.round(tdee - 100);
    } else if (regData.primaryGoal === "ENDURANCE") {
      tdee += 200;
    } else {
      tdee -= 400; // Déficit calórico controlado
    }

    // Recommended water: 35ml per kg
    const waterMl = Math.round(regData.weightKg * 35);

    setRegData((prev) => ({
      ...prev,
      dailyCalorieGoalKcal: Math.max(1200, tdee),
      dailyWaterGoalMl: Math.max(1500, waterMl),
    }));
  }, [
    regData.weightKg,
    regData.heightCm,
    regData.age,
    regData.gender,
    regData.activityLevel,
    regData.primaryGoal,
    knowsNutritionGoals,
  ]);

  // ----------------------------------------------------
  // LOGIN SUBMIT
  // ----------------------------------------------------
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    const cleanIdentifier = sanitizeInput(loginIdentifier).toLowerCase();
    if (!cleanIdentifier || !loginPassword) {
      setLoginError("Informe seu e-mail ou codinome e a senha.");
      return;
    }

    // Check rate limit lockout
    const rateStatus = getRateLimitStatus(cleanIdentifier);
    if (rateStatus.isLocked) {
      setLockoutRemaining(rateStatus.remainingSeconds);
      setLoginError(`Acesso bloqueado temporariamente por segurança. Aguarde ${rateStatus.remainingSeconds}s.`);
      return;
    }

    setLoginLoading(true);

    try {
      // 1. Attempt authentication via multi-tier server auth API (Requirement 36)
      const serverResult = await loginViaServer(cleanIdentifier, loginPassword);
      if (serverResult.success && serverResult.user) {
        let localUser = getAllUsers().find(
          (u) =>
            u.id === serverResult.user.id ||
            u.email.toLowerCase() === cleanIdentifier ||
            u.handle.toLowerCase() === cleanIdentifier
        );
        if (!localUser) {
          localUser = {
            id: serverResult.user.id,
            handle: serverResult.user.handle,
            name: serverResult.user.name,
            email: serverResult.user.email,
            passwordHash: "",
            passwordSalt: "",
            pinHash: "",
            recoveryKey: "",
            twoFactorEnabled: Boolean(serverResult.user.totpEnabled),
            twoFactorSecret: "",
            createdAt: serverResult.user.createdAt || new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
            failedLoginAttempts: 0,
            lockedUntil: null,
            profile: {
              id: serverResult.user.id,
              handle: serverResult.user.handle,
              name: serverResult.user.name,
              email: serverResult.user.email,
              registeredAt: serverResult.user.createdAt || new Date().toISOString(),
              age: 28,
              gender: "male",
              heightCm: 178,
              initialWeightKg: 75,
              weightKg: 75,
              targetWeightKg: 75,
              primaryGoal: "HYPERTROPHY",
              activityLevel: "MODERATE",
            },
            securitySettings: {
              pinHash: "",
              hasPinSet: false,
              isLocked: false,
              autoLockMinutes: 15,
              stealthMode: false,
              stealthModeActive: false,
              lgpdConsentAccepted: true,
              consentTimestamp: new Date().toISOString(),
              vaultEncryptionEnabled: true,
              twoFactorEnabled: Boolean(serverResult.user.totpEnabled),
            },
          };
          saveAllUsers([...getAllUsers(), localUser]);
        }
        clearFailedLoginAttempts(cleanIdentifier);
        finalizeLoginSuccess(localUser);
        return;
      }

      if (serverResult.totpRequired) {
        clearFailedLoginAttempts(cleanIdentifier);
        const matched = getAllUsers().find(
          (u) =>
            u.email.toLowerCase() === cleanIdentifier ||
            u.handle.toLowerCase() === cleanIdentifier
        );
        if (matched) setPendingUser(matched);
        setRequiresTwoFactor(true);
        setLoginLoading(false);
        return;
      }

      // 2. Fallback to offline local vault check
      const users = getAllUsers();
      const user = users.find(
        (u) =>
          u.email.toLowerCase() === cleanIdentifier ||
          u.handle.toLowerCase() === cleanIdentifier
      );

      if (!user) {
        const lockRes = recordFailedLoginAttempt(cleanIdentifier);
        logAuditEvent({
          emailOrHandle: cleanIdentifier,
          status: "FAILED",
          reason: "IDENTIFIER_NOT_FOUND",
        });
        setLoginLoading(false);
        if (lockRes.isLocked) {
          setLockoutRemaining(lockRes.remainingSeconds);
          setLoginError(`Múltiplas tentativas incorretas. Acesso bloqueado por ${lockRes.remainingSeconds}s.`);
        } else {
          setLoginError("Credenciais não encontradas. Verifique seus dados.");
        }
        return;
      }

      // Compute PBKDF2 hash with user salt
      const testHash = await hashPassword(loginPassword, user.passwordSalt);

      if (testHash !== user.passwordHash) {
        const lockRes = recordFailedLoginAttempt(cleanIdentifier);
        logAuditEvent({
          userId: user.id,
          emailOrHandle: cleanIdentifier,
          status: "FAILED",
          reason: "INVALID_PASSWORD_HASH",
        });
        setLoginLoading(false);
        if (lockRes.isLocked) {
          setLockoutRemaining(lockRes.remainingSeconds);
          setLoginError(`Múltiplas falhas detectadas. Acesso bloqueado por ${lockRes.remainingSeconds}s.`);
        } else {
          setLoginError(`Senha incorreta. Tentativas restantes: ${Math.max(0, 3 - lockRes.failedAttempts)}.`);
        }
        return;
      }

      // 2FA Challenge check
      if (user.twoFactorEnabled) {
        clearFailedLoginAttempts(cleanIdentifier);
        setPendingUser(user);
        setRequiresTwoFactor(true);
        setLoginLoading(false);
        return;
      }

      // Successful direct login
      finalizeLoginSuccess(user);
    } catch (err) {
      console.error(err);
      setLoginError("Erro na autenticação. Tente novamente.");
      setLoginLoading(false);
    }
  };

  // ----------------------------------------------------
  // 2FA VERIFICATION SUBMIT (RFC 6238 TOTP AUTHENTICATOR VERIFICATION)
  // ----------------------------------------------------
  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUser) return;
    setLoginError("");

    if (useBackupKey) {
      const cleanKey = backupKeyInput.trim().toUpperCase();
      if (cleanKey === pendingUser.recoveryKey) {
        logAuditEvent({
          userId: pendingUser.id,
          emailOrHandle: pendingUser.email,
          status: "RECOVERY_USED",
          reason: "LOGIN_RECOVERY_KEY_VERIFIED",
        });
        finalizeLoginSuccess(pendingUser);
        return;
      } else {
        logAuditEvent({
          userId: pendingUser.id,
          emailOrHandle: pendingUser.email,
          status: "2FA_FAILED",
          reason: "INVALID_RECOVERY_KEY",
        });
        setLoginError("Código de recuperação de emergência incorreto.");
        return;
      }
    }

    const cleanCode = twoFactorCode.replace(/\D/g, "");
    if (cleanCode.length !== 6) {
      setLoginError("Insira o código TOTP de 6 dígitos.");
      return;
    }

    // Verify cryptographic TOTP token with tolerance
    const isValidTotp = await verifyTotpToken(pendingUser.twoFactorSecret, cleanCode);
    if (!isValidTotp) {
      logAuditEvent({
        userId: pendingUser.id,
        emailOrHandle: pendingUser.email,
        status: "2FA_FAILED",
        reason: "INVALID_RFC6238_TOTP_TOKEN",
      });
      setLoginError("Código de autenticação incorreto ou expirado. Verifique seu app autenticador.");
      return;
    }

    logAuditEvent({
      userId: pendingUser.id,
      emailOrHandle: pendingUser.email,
      status: "SUCCESS",
      reason: "TOTP_2FA_VERIFIED",
    });

    finalizeLoginSuccess(pendingUser);
  };

  const finalizeLoginSuccess = (user: AuthUser) => {
    clearFailedLoginAttempts(user.email);
    clearFailedLoginAttempts(user.handle);

    const sessionDays = rememberMe ? 30 : 1;
    const expiresAt = new Date(Date.now() + sessionDays * 24 * 60 * 60 * 1000).toISOString();

    const session: AuthSession = {
      token: generateSessionToken(),
      userId: user.id,
      createdAt: new Date().toISOString(),
      expiresAt,
      rememberMe,
    };

    setActiveSession(session);

    // Update user last login
    const allUsers = getAllUsers();
    const idx = allUsers.findIndex((u) => u.id === user.id);
    if (idx !== -1) {
      allUsers[idx].lastLoginAt = new Date().toISOString();
      allUsers[idx].failedLoginAttempts = 0;
      saveAllUsers(allUsers);
    }

    setLoginLoading(false);
    onAuthenticated(user);
  };

  // ----------------------------------------------------
  // REGISTRATION SUBMIT
  // ----------------------------------------------------
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");

    if (!regData.fullName.trim() || !regData.email.trim()) {
      setRegError("Preencha o nome completo e o e-mail.");
      setRegStep(1);
      return;
    }

    // Ensure codename is assigned
    const autoHandle = regData.handle || generateCodename(regData.fullName);

    if (regPasswordStrength.score < 2) {
      setRegError("A senha precisa ser mais segura (mínimo 8 caracteres com letras e números).");
      setRegStep(1);
      return;
    }

    if (regData.password !== regData.confirmPassword) {
      setRegError("As senhas não coincidem.");
      setRegStep(1);
      return;
    }

    if (!regData.lgpdConsentAccepted) {
      setRegError("É necessário aceitar os termos de uso e privacidade dos dados.");
      return;
    }

    if (!regData.age || !regData.heightCm || !regData.weightKg) {
      setRegError("Preencha sua idade, altura e peso corporal real para calibrar o perfil biológico.");
      setRegStep(2);
      return;
    }

    // Check uniqueness of email
    const users = getAllUsers();
    const existing = users.find(
      (u) =>
        u.email.toLowerCase() === regData.email.toLowerCase().trim() ||
        u.handle.toLowerCase() === autoHandle.toLowerCase().trim()
    );

    if (existing) {
      setRegError("Já existe uma conta registrada com este e-mail.");
      setRegStep(1);
      return;
    }

    setRegLoading(true);

    try {
      const salt = generateCryptographicSalt(16);
      const passwordHash = await hashPassword(regData.password, salt);
      const pinHash = regData.pin ? await hashPin(regData.pin) : "";
      const userId = "user_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 6);

      const profile: UserProfile = {
        id: userId,
        handle: autoHandle.toLowerCase().trim(),
        name: regData.fullName.trim(),
        email: regData.email.toLowerCase().trim(),
        registeredAt: new Date().toISOString(),
        age: regData.age,
        gender: regData.gender,
        heightCm: regData.heightCm,
        initialWeightKg: regData.weightKg,
        weightKg: regData.weightKg,
        targetWeightKg: regData.targetWeightKg || regData.weightKg,
        primaryGoal: regData.primaryGoal,
        activityLevel: regData.activityLevel,
      };

      const totpSecret = generateTotpSecret(20);

      const securitySettings: SecuritySettings = {
        pinHash,
        hasPinSet: Boolean(regData.pin),
        isLocked: false,
        autoLockMinutes: 15,
        stealthMode: false,
        stealthModeActive: false,
        lgpdConsentAccepted: true,
        consentTimestamp: new Date().toISOString(),
        vaultEncryptionEnabled: true,
        twoFactorEnabled: regData.enableTwoFactor,
        twoFactorSecret: totpSecret,
      };

      const newUser: AuthUser = {
        id: userId,
        email: regData.email.toLowerCase().trim(),
        handle: autoHandle.toLowerCase().trim(),
        name: regData.fullName.trim(),
        passwordHash,
        passwordSalt: salt,
        pinHash,
        recoveryKey: generatedRecoveryKey || generateRecoveryKey(),
        twoFactorEnabled: regData.enableTwoFactor,
        twoFactorSecret: totpSecret,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        failedLoginAttempts: 0,
        lockedUntil: null,
        profile,
        securitySettings,
      };

      saveAllUsers([...users, newUser]);

      // Sync registration with server auth service (Requirement 36)
      try {
        await registerViaServer({
          handle: autoHandle.toLowerCase().trim(),
          name: regData.fullName.trim(),
          email: regData.email.toLowerCase().trim(),
          password: regData.password,
          totpSecret: regData.enableTwoFactor ? totpSecret : undefined,
          role: "user",
        });
      } catch (srvErr) {
        console.warn("Server auth sync warning:", srvErr);
      }

      // Initialize body metrics
      const initialBody = createInitialCleanBodyMetrics(
        regData.weightKg,
        regData.heightCm,
        regData.age,
        regData.gender
      );

      if (hasCustomMeasurements) {
        if (initialBody.regions.abdomen) initialBody.regions.abdomen.currentCm = regData.waistCm;
        if (initialBody.regions.chest) initialBody.regions.chest.currentCm = regData.chestCm;
        if (initialBody.regions.arm_right) initialBody.regions.arm_right.currentCm = regData.armCm;
        if (initialBody.regions.thigh_right) initialBody.regions.thigh_right.currentCm = regData.thighCm;
      }
      initialBody.bodyFatPercent = regData.bodyFatPercent || 15;

      const initialNutrition = {
        ...cleanNutrition,
        caloriesTarget: regData.dailyCalorieGoalKcal,
        waterTargetMl: regData.dailyWaterGoalMl,
      };

      const initialSleep = {
        ...cleanSleep,
        bedTime: regData.typicalBedTime,
        wakeTime: regData.typicalWakeTime,
      };

      setUserVaultItem(userId, "body_metrics", initialBody);
      setUserVaultItem(userId, "nutrition", initialNutrition);
      setUserVaultItem(userId, "sleep", initialSleep);
      setUserVaultItem(userId, "workouts", []);
      setUserVaultItem(userId, "cardio", []);
      setUserVaultItem(userId, "habits", []);
      setUserVaultItem(userId, "goals", []);
      setUserVaultItem(userId, "health_timeline", []);
      setUserVaultItem(userId, "profile", profile);
      setUserVaultItem(userId, "security", securitySettings);

      finalizeLoginSuccess(newUser);
    } catch (err) {
      console.error("Registration error:", err);
      setRegError("Não foi possível salvar o cadastro. Tente novamente.");
      setRegLoading(false);
    }
  };

  // ----------------------------------------------------
  // RECOVERY SUBMIT (Supports Recovery Code OR 4-digit PIN)
  // ----------------------------------------------------
  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError("");

    const cleanId = recoveryIdentifier.toLowerCase().trim();
    const cleanKeyOrPin = recoveryKey.trim();

    if (!cleanId || !cleanKeyOrPin || !newPassword) {
      setRecoveryError("Preencha seu e-mail, o código de recuperação (ou PIN) e a nova senha.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setRecoveryError("A confirmação da nova senha não confere.");
      return;
    }

    if (newPasswordStrength.score < 2) {
      setRecoveryError("A nova senha deve possuir pelo menos 8 dígitos com números e letras.");
      return;
    }

    setRecoveryLoading(true);

    try {
      const users = getAllUsers();
      const user = users.find(
        (u) => u.email.toLowerCase() === cleanId || u.handle.toLowerCase() === cleanId
      );

      if (!user) {
        setRecoveryError("Conta não encontrada. Verifique seu e-mail cadastrado.");
        setRecoveryLoading(false);
        return;
      }

      // Check if matches either recoveryKey or pin
      const isKeyMatch = user.recoveryKey.trim().toUpperCase() === cleanKeyOrPin.toUpperCase();
      let isPinMatch = false;
      if (user.pinHash && cleanKeyOrPin.length >= 4 && /^\d+$/.test(cleanKeyOrPin)) {
        const testPinHash = await hashPin(cleanKeyOrPin);
        if (testPinHash === user.pinHash) {
          isPinMatch = true;
        }
      }

      if (!isKeyMatch && !isPinMatch) {
        setRecoveryError("Código de recuperação ou PIN incorreto.");
        setRecoveryLoading(false);
        return;
      }

      const idx = users.findIndex((u) => u.id === user.id);
      const newSalt = generateCryptographicSalt(16);
      const newHash = await hashPassword(newPassword, newSalt);
      const newRecKey = generateRecoveryKey();

      users[idx].passwordHash = newHash;
      users[idx].passwordSalt = newSalt;
      users[idx].recoveryKey = newRecKey;
      users[idx].failedLoginAttempts = 0;
      users[idx].lockedUntil = null;

      saveAllUsers(users);
      clearFailedLoginAttempts(cleanId);

      setRecoverySuccess(true);
      setRecoveryLoading(false);
    } catch (err) {
      console.error(err);
      setRecoveryError("Erro ao processar a redefinição de senha.");
      setRecoveryLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col justify-between font-sans relative selection:bg-white selection:text-black">
      {/* Top Banner */}
      <header className="border-b border-zinc-800/80 bg-zinc-950 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          {onBackToIntro && (
            <button
              type="button"
              onClick={onBackToIntro}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 mr-2 font-mono transition-colors border border-zinc-800 hover:border-zinc-700 bg-zinc-900 px-2 py-1"
              title="Voltar para a página de introdução do Gym Labs"
            >
              &larr; Sobre o App
            </button>
          )}
          <div className="w-2 h-2 rounded-full bg-white" />
          <span className="font-semibold text-sm tracking-wider text-white uppercase">
            Gym Labs
          </span>
          <span className="text-zinc-600">//</span>
          <span className="text-xs text-zinc-400">
            Acesso Seguro
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <ShieldCheck className="w-3.5 h-3.5 text-zinc-300" />
          <span className="hidden sm:inline">Proteção de Dados Ativa</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-3 sm:p-6 my-4">
        <div className="w-full max-w-xl bg-zinc-950 border border-zinc-800 shadow-2xl hud-corners">
          {/* Header Bar */}
          <div className="border-b border-zinc-800 px-4 sm:px-5 py-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              <span className="font-medium text-zinc-300 uppercase tracking-wide">
                Identificação de Usuário
              </span>
            </div>
            <span className="text-zinc-500 font-mono text-[11px]">v5.0</span>
          </div>

          {/* Navigation Tabs: ONLY 2 tabs (Entrar & Cadastrar) */}
          <div className="grid grid-cols-2 border-b border-zinc-800 text-xs">
            <button
              type="button"
              onClick={() => {
                setActiveTab("login");
                setIsRecoveringPassword(false);
                setRequiresTwoFactor(false);
                setLoginError("");
              }}
              className={`py-2.5 px-4 text-center font-semibold tracking-wider flex items-center justify-center gap-2 border-r border-zinc-800 transition-colors ${
                activeTab === "login" && !isRecoveringPassword
                  ? "bg-zinc-900 text-white border-b-2 border-b-white"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>ENTRAR</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("register");
                setIsRecoveringPassword(false);
                setRegError("");
              }}
              className={`py-2.5 px-4 text-center font-semibold tracking-wider flex items-center justify-center gap-2 transition-colors ${
                activeTab === "register"
                  ? "bg-zinc-900 text-white border-b-2 border-b-white"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>CRIAR CONTA</span>
            </button>
          </div>

          {/* ==================================================== */}
          {/* TAB 1: LOGIN VIEW OR RECOVERY SUB-VIEW                */}
          {/* ==================================================== */}
          {activeTab === "login" && (
            <div className="p-5 sm:p-7">
              {/* If password recovery is active inside login */}
              {isRecoveringPassword ? (
                <div>
                  {!recoverySuccess ? (
                    <form onSubmit={handleRecovery} className="space-y-4">
                      <div>
                        <button
                          type="button"
                          onClick={() => {
                            setIsRecoveringPassword(false);
                            setRecoveryError("");
                          }}
                          className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 mb-3"
                        >
                          &larr; Voltar para o login
                        </button>
                        <h2 className="text-base font-semibold text-white">
                          Recuperação de Senha
                        </h2>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          Informe seu e-mail cadastrado e seu PIN de 4 dígitos ou código de recuperação para criar uma nova senha.
                        </p>
                      </div>

                      {recoveryError && (
                        <div className="p-3 bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-zinc-300 shrink-0 mt-0.5" />
                          <span>{recoveryError}</span>
                        </div>
                      )}

                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-zinc-300 uppercase tracking-wider mb-1">
                            E-mail Cadastrado
                          </label>
                          <input
                            type="text"
                            required
                            value={recoveryIdentifier}
                            onChange={(e) => setRecoveryIdentifier(e.target.value)}
                            placeholder="seu@email.com"
                            className="w-full bg-black border border-zinc-700 focus:border-white text-zinc-100 text-sm px-3 py-2 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-zinc-300 uppercase tracking-wider mb-1">
                            PIN de 4 dígitos OU Código de Recuperação
                          </label>
                          <input
                            type="text"
                            required
                            value={recoveryKey}
                            onChange={(e) => setRecoveryKey(e.target.value)}
                            placeholder="ex: 1234 ou REC-XXXX-XXXX-XXXX"
                            className="w-full bg-black border border-zinc-700 focus:border-white text-zinc-100 text-sm px-3 py-2 outline-none"
                          />
                          <span className="text-[11px] text-zinc-500 block mt-1">
                            Você pode usar tanto o seu PIN de segurança quanto o código emitido no cadastro.
                          </span>
                        </div>

                        <div>
                          <label className="block text-xs text-zinc-300 uppercase tracking-wider mb-1">
                            Nova Senha
                          </label>
                          <input
                            type="password"
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Mínimo 8 caracteres"
                            className="w-full bg-black border border-zinc-700 focus:border-white text-zinc-100 text-sm px-3 py-2 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-zinc-300 uppercase tracking-wider mb-1">
                            Confirmar Nova Senha
                          </label>
                          <input
                            type="password"
                            required
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            placeholder="Repita a nova senha"
                            className="w-full bg-black border border-zinc-700 focus:border-white text-zinc-100 text-sm px-3 py-2 outline-none"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={recoveryLoading}
                        className="w-full bg-white hover:bg-zinc-200 text-black font-semibold text-xs py-2.5 px-4 uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mt-2"
                      >
                        {recoveryLoading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Redefinindo senha...</span>
                          </>
                        ) : (
                          <>
                            <Key className="w-4 h-4" />
                            <span>Redefinir Senha</span>
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    <div className="text-center py-6 space-y-4">
                      <div className="w-10 h-10 border border-zinc-600 bg-zinc-900 text-white flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <h3 className="text-base font-semibold text-white">
                        Senha Redefinida com Sucesso
                      </h3>
                      <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                        Sua nova senha já está ativa. Você pode fazer login agora.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setIsRecoveringPassword(false);
                          setRecoverySuccess(false);
                          setRecoveryKey("");
                          setNewPassword("");
                          setConfirmNewPassword("");
                        }}
                        className="px-6 py-2 bg-white text-black font-semibold text-xs uppercase tracking-wider"
                      >
                        Ir para o Login
                      </button>
                    </div>
                  )}
                </div>
              ) : !requiresTwoFactor ? (
                /* STANDARD LOGIN FORM */
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <h2 className="text-base font-semibold text-white">
                      Entrar no Gym Labs
                    </h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Insira seu e-mail cadastrado ou codinome e sua senha.
                    </p>
                  </div>

                  {loginError && (
                    <div className="p-3 bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-zinc-300 shrink-0 mt-0.5" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  {lockoutRemaining > 0 && (
                    <div className="p-3 bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-white" />
                        <span>Bloqueio de segurança temporário:</span>
                      </div>
                      <span className="font-bold text-white font-mono">{lockoutRemaining}s</span>
                    </div>
                  )}

                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-xs text-zinc-300 uppercase tracking-wider mb-1">
                        E-mail ou Codinome
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          value={loginIdentifier}
                          onChange={(e) => setLoginIdentifier(e.target.value)}
                          placeholder="seu@email.com ou seu.nome"
                          required
                          disabled={lockoutRemaining > 0}
                          className="w-full bg-black border border-zinc-700 focus:border-white text-zinc-100 text-sm pl-9 pr-3 py-2 outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs text-zinc-300 uppercase tracking-wider">
                          Senha
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsRecoveringPassword(true)}
                          className="text-xs text-zinc-400 hover:text-white hover:underline"
                        >
                          Esqueceu a senha?
                        </button>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type={showLoginPassword ? "text" : "password"}
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          disabled={lockoutRemaining > 0}
                          className="w-full bg-black border border-zinc-700 focus:border-white text-zinc-100 text-sm pl-9 pr-10 py-2 outline-none transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300"
                        >
                          {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="accent-white bg-zinc-900 border-zinc-700"
                        />
                        <span>Lembrar login</span>
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loginLoading || lockoutRemaining > 0}
                    className="w-full bg-white hover:bg-zinc-200 text-black font-semibold text-xs py-2.5 px-4 uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mt-4"
                  >
                    {loginLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Autenticando...</span>
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4" />
                        <span>Entrar no Gym Labs</span>
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </button>

                  <div className="pt-2 text-center">
                    <p className="text-xs text-zinc-500">
                      Não possui uma conta?{" "}
                      <button
                        type="button"
                        onClick={() => setActiveTab("register")}
                        className="text-white font-medium hover:underline"
                      >
                        Cadastre-se aqui &rarr;
                      </button>
                    </p>
                  </div>
                </form>
              ) : (
                /* 2FA VERIFICATION SUB-VIEW */
                <form onSubmit={handleVerify2FA} className="space-y-4">
                  <div>
                    <h2 className="text-base font-semibold text-white">
                      Verificação em 2 Etapas (2FA)
                    </h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Usuário: @{pendingUser?.handle} ({pendingUser?.email})
                    </p>
                  </div>

                  {loginError && (
                    <div className="p-3 bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs">
                      {loginError}
                    </div>
                  )}

                  {!useBackupKey ? (
                    <div className="space-y-2">
                      <label className="block text-xs text-zinc-300 uppercase tracking-wider">
                        Código de 6 dígitos
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={twoFactorCode}
                        onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="123456"
                        autoFocus
                        required
                        className="w-full tracking-[0.4em] text-center font-mono text-xl py-2.5 bg-black border border-zinc-700 focus:border-white text-white outline-none"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="block text-xs text-zinc-300 uppercase tracking-wider">
                        Código de Recuperação
                      </label>
                      <input
                        type="text"
                        value={backupKeyInput}
                        onChange={(e) => setBackupKeyInput(e.target.value)}
                        placeholder="REC-XXXX-XXXX-XXXX"
                        autoFocus
                        required
                        className="w-full font-mono text-sm py-2 px-3 bg-black border border-zinc-700 focus:border-white text-white outline-none uppercase"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => setUseBackupKey(!useBackupKey)}
                      className="text-zinc-400 hover:text-white underline"
                    >
                      {useBackupKey ? "Usar código de 6 dígitos" : "Usar código de recuperação"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRequiresTwoFactor(false);
                        setPendingUser(null);
                      }}
                      className="text-zinc-500 hover:text-zinc-300"
                    >
                      Voltar
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-white hover:bg-zinc-200 text-black font-semibold text-xs py-2.5 px-4 uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                  >
                    Confirmar e Entrar
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 2: REGISTRATION VIEW (Multi-Step Form)          */}
          {/* ==================================================== */}
          {activeTab === "register" && (
            <div className="p-5 sm:p-7">
              {/* Stepper Progress */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-white uppercase tracking-wider">
                    Passo {regStep} de 4 — {
                      regStep === 1
                        ? "Identificação & Senha"
                        : regStep === 2
                        ? "Dados Corporais Básicos"
                        : regStep === 3
                        ? "Metas de Nutrição & Água"
                        : "Código de Recuperação & Finalização"
                    }
                  </span>
                  <span className="text-xs text-zinc-500 font-mono">
                    {Math.round((regStep / 4) * 100)}%
                  </span>
                </div>
                <div className="w-full h-1 bg-zinc-800">
                  <div
                    className="bg-white h-full transition-all duration-300"
                    style={{ width: `${(regStep / 4) * 100}%` }}
                  />
                </div>
              </div>

              {regError && (
                <div className="mb-4 p-3 bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-zinc-300 shrink-0 mt-0.5" />
                  <span>{regError}</span>
                </div>
              )}

              <form onSubmit={regStep === 4 ? handleRegister : (e) => { e.preventDefault(); setRegStep((s) => (s < 4 ? ((s + 1) as any) : s)); }}>
                {/* STEP 1: CREDENCIAIS & ACESSO */}
                {regStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-zinc-300 uppercase tracking-wider mb-1">
                        Nome Completo *
                      </label>
                      <input
                        type="text"
                        required
                        value={regData.fullName}
                        onChange={(e) => {
                          const name = e.target.value;
                          const autoHandle = generateCodename(name);
                          setRegData({ ...regData, fullName: name, handle: autoHandle });
                        }}
                        placeholder="ex: Alex Carlos Silva"
                        className="w-full bg-black border border-zinc-700 focus:border-white text-zinc-100 text-sm px-3 py-2 outline-none"
                      />
                      {regData.fullName && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-zinc-400">
                          <span className="text-zinc-500">Codinome atribuído pelo app:</span>
                          <span className="px-2 py-0.5 border border-zinc-800 bg-zinc-900 text-white font-mono text-[11px]">
                            @{regData.handle || generateCodename(regData.fullName)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs text-zinc-300 uppercase tracking-wider mb-1">
                        E-mail de Acesso *
                      </label>
                      <input
                        type="email"
                        required
                        value={regData.email}
                        onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                        placeholder="seu@email.com"
                        className="w-full bg-black border border-zinc-700 focus:border-white text-zinc-100 text-sm px-3 py-2 outline-none"
                      />
                    </div>

                    {/* PASSWORD */}
                    <div>
                      <label className="block text-xs text-zinc-300 uppercase tracking-wider mb-1">
                        Senha de Acesso *
                      </label>
                      <div className="relative">
                        <input
                          type={showRegPassword ? "text" : "password"}
                          required
                          value={regData.password}
                          onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                          placeholder="Mínimo 8 caracteres (letras e números)"
                          className="w-full bg-black border border-zinc-700 focus:border-white text-zinc-100 text-sm px-3 py-2 pr-10 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300"
                        >
                          {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {regData.password && (
                        <div className="mt-2 p-2 bg-zinc-900 border border-zinc-800 text-xs space-y-1">
                          <div className="flex items-center justify-between text-zinc-400">
                            <span>Segurança da Senha:</span>
                            <span className="font-semibold text-white">
                              {regPasswordStrength.label}
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-1 h-1 w-full bg-zinc-800">
                            {[1, 2, 3, 4].map((lvl) => (
                              <div
                                key={lvl}
                                className={`h-full ${
                                  regPasswordStrength.score >= lvl ? "bg-white" : "bg-zinc-800"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-zinc-300 uppercase tracking-wider mb-1">
                          Confirmar Senha *
                        </label>
                        <input
                          type="password"
                          required
                          value={regData.confirmPassword}
                          onChange={(e) => setRegData({ ...regData, confirmPassword: e.target.value })}
                          placeholder="Repita a senha"
                          className="w-full bg-black border border-zinc-700 focus:border-white text-zinc-100 text-sm px-3 py-2 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-zinc-300 uppercase tracking-wider mb-1">
                          PIN Rápido (4 dígitos)
                        </label>
                        <input
                          type="password"
                          maxLength={4}
                          value={regData.pin}
                          onChange={(e) => setRegData({ ...regData, pin: e.target.value.replace(/\D/g, "") })}
                          placeholder="ex: 1234"
                          className="w-full bg-black border border-zinc-700 focus:border-white text-white text-center tracking-widest text-sm px-3 py-2 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: BIOMETRIA & DADOS BÁSICOS (Métricas e porcentagens opcionais) */}
                {regStep === 2 && (
                  <div className="space-y-4">
                    <div className="border-b border-zinc-800 pb-2 mb-2">
                      <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                        Dados Básicos (Obrigatórios)
                      </h3>
                      <p className="text-[11px] text-zinc-400">
                        Usados para o cálculo de metabolismo e hidratação.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs text-zinc-400 uppercase mb-1">Idade *</label>
                        <input
                          type="number"
                          min={14}
                          max={99}
                          required
                          value={regData.age || ""}
                          placeholder="Ex: 26"
                          onChange={(e) => setRegData({ ...regData, age: Number(e.target.value) })}
                          className="w-full bg-black border border-zinc-700 text-zinc-100 text-sm px-3 py-2 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-zinc-400 uppercase mb-1">Gênero *</label>
                        <select
                          value={regData.gender}
                          onChange={(e) => setRegData({ ...regData, gender: e.target.value as any })}
                          className="w-full bg-black border border-zinc-700 text-zinc-100 text-sm px-2 py-2 outline-none"
                        >
                          <option value="male">Masculino</option>
                          <option value="female">Feminino</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-zinc-400 uppercase mb-1">Altura (cm) *</label>
                        <input
                          type="number"
                          min={100}
                          max={240}
                          required
                          value={regData.heightCm || ""}
                          placeholder="Ex: 175"
                          onChange={(e) => setRegData({ ...regData, heightCm: Number(e.target.value) })}
                          className="w-full bg-black border border-zinc-700 text-zinc-100 text-sm px-3 py-2 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-zinc-400 uppercase mb-1">Peso (kg) *</label>
                        <input
                          type="number"
                          step={0.1}
                          min={30}
                          max={300}
                          required
                          value={regData.weightKg || ""}
                          placeholder="Ex: 75.0"
                          onChange={(e) => setRegData({ ...regData, weightKg: Number(e.target.value) })}
                          className="w-full bg-black border border-zinc-700 text-white font-semibold text-sm px-3 py-2 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-zinc-400 uppercase mb-1">
                        Nível de Atividade Física
                      </label>
                      <select
                        value={regData.activityLevel}
                        onChange={(e) => setRegData({ ...regData, activityLevel: e.target.value as any })}
                        className="w-full bg-black border border-zinc-700 text-zinc-100 text-sm px-3 py-2 outline-none"
                      >
                        <option value="SEDENTARY">Sedentário (pouco ou nenhum exercício)</option>
                        <option value="MODERATE">Moderado (treina 3 a 4x por semana)</option>
                        <option value="HIGH">Intenso (treina 5 a 6x por semana)</option>
                        <option value="ATHLETE">Atleta (treinos diários ou dupla jornada)</option>
                      </select>
                    </div>

                    {/* OPTIONAL METRICS SECTION */}
                    <div className="pt-3 border-t border-zinc-850">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="text-xs font-semibold text-zinc-300 block">
                            Medidas Complementares e Porcentagens
                          </span>
                          <span className="text-[11px] text-zinc-500">
                            Totalmente opcionais — você pode preencher agora ou depois quando tiver os dados.
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setHasCustomMeasurements(!hasCustomMeasurements)}
                          className="text-xs px-2.5 py-1 border border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white"
                        >
                          {hasCustomMeasurements ? "Ocultar opcionais" : "Preencher agora"}
                        </button>
                      </div>

                      {hasCustomMeasurements && (
                        <div className="space-y-3 pt-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-zinc-400 mb-1">
                                Peso Alvo (kg) <span className="text-zinc-500 text-[10px]">(Opcional)</span>
                              </label>
                              <input
                                type="number"
                                step={0.1}
                                value={regData.targetWeightKg || ""}
                                onChange={(e) => setRegData({ ...regData, targetWeightKg: Number(e.target.value) })}
                                placeholder="Ex: 72"
                                className="w-full bg-black border border-zinc-700 text-zinc-100 text-sm px-3 py-2 outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-xs text-zinc-400 mb-1">
                                % Gordura Corporal (BF) <span className="text-zinc-500 text-[10px]">(Opcional)</span>
                              </label>
                              <input
                                type="number"
                                step={0.1}
                                min={3}
                                max={60}
                                value={regData.bodyFatPercent || ""}
                                onChange={(e) => setRegData({ ...regData, bodyFatPercent: Number(e.target.value) })}
                                placeholder="Ex: 16"
                                className="w-full bg-black border border-zinc-700 text-zinc-100 text-sm px-3 py-2 outline-none"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                            <div>
                              <label className="block text-[10px] text-zinc-500 uppercase mb-1">Cintura (cm)</label>
                              <input
                                type="number"
                                step={0.5}
                                value={regData.waistCm || ""}
                                onChange={(e) => setRegData({ ...regData, waistCm: Number(e.target.value) })}
                                placeholder="cm"
                                className="w-full bg-black border border-zinc-700 text-zinc-100 text-xs px-2 py-1.5 outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-zinc-500 uppercase mb-1">Tórax (cm)</label>
                              <input
                                type="number"
                                step={0.5}
                                value={regData.chestCm || ""}
                                onChange={(e) => setRegData({ ...regData, chestCm: Number(e.target.value) })}
                                placeholder="cm"
                                className="w-full bg-black border border-zinc-700 text-zinc-100 text-xs px-2 py-1.5 outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-zinc-500 uppercase mb-1">Braço (cm)</label>
                              <input
                                type="number"
                                step={0.5}
                                value={regData.armCm || ""}
                                onChange={(e) => setRegData({ ...regData, armCm: Number(e.target.value) })}
                                placeholder="cm"
                                className="w-full bg-black border border-zinc-700 text-zinc-100 text-xs px-2 py-1.5 outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-zinc-500 uppercase mb-1">Coxa (cm)</label>
                              <input
                                type="number"
                                step={0.5}
                                value={regData.thighCm || ""}
                                onChange={(e) => setRegData({ ...regData, thighCm: Number(e.target.value) })}
                                placeholder="cm"
                                className="w-full bg-black border border-zinc-700 text-zinc-100 text-xs px-2 py-1.5 outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 3: NUTRIÇÃO & METAS (Auto-calculadas pelo Gym Labs ou perguntas) */}
                {regStep === 3 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-zinc-400 uppercase mb-1">
                        Seu Objetivo Principal
                      </label>
                      <select
                        value={regData.primaryGoal}
                        onChange={(e) => setRegData({ ...regData, primaryGoal: e.target.value as any })}
                        className="w-full bg-black border border-zinc-700 text-white font-medium text-sm px-3 py-2 outline-none"
                      >
                        <option value="HYPERTROPHY">Hipertrofia Muscular (Ganho de Massa Magra)</option>
                        <option value="STRENGTH">Ganho de Força e Performance</option>
                        <option value="RECOMPOSITION">Recomposição Corporal (Perder gordura + Ganhar massa)</option>
                        <option value="ENDURANCE">Condicionamento Aeróbico e Resistência</option>
                        <option value="HEALTH_LONGEVITY">Saúde Geral, Disposição e Longevidade</option>
                      </select>
                    </div>

                    {/* Auto Calculation vs User Question Choice */}
                    <div className="border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calculator className="w-4 h-4 text-white" />
                          <span className="text-xs font-semibold text-white uppercase tracking-wider">
                            Metas de Calorias e Água
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setKnowsNutritionGoals(!knowsNutritionGoals)}
                          className="text-xs text-zinc-400 hover:text-white underline"
                        >
                          {knowsNutritionGoals
                            ? "Voltar ao cálculo automático do app"
                            : "Já sei minhas metas prescritas"}
                        </button>
                      </div>

                      {!knowsNutritionGoals ? (
                        /* AUTOMATIC CALCULATION CARD */
                        <div className="space-y-3 pt-1">
                          <p className="text-xs text-zinc-400">
                            O Gym Labs calculou automaticamente suas metas diárias com base em seu peso ({regData.weightKg}kg), altura ({regData.heightCm}cm), idade ({regData.age} anos) e nível de atividade:
                          </p>

                          <div className="grid grid-cols-2 gap-3 pt-1">
                            <div className="p-3 bg-black border border-zinc-800">
                              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">
                                Meta Calórica Diária
                              </span>
                              <div className="flex items-baseline gap-1">
                                <span className="text-xl font-bold font-mono text-white">
                                  {regData.dailyCalorieGoalKcal}
                                </span>
                                <span className="text-xs text-zinc-500">kcal/dia</span>
                              </div>
                            </div>

                            <div className="p-3 bg-black border border-zinc-800">
                              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">
                                Meta de Hidratação
                              </span>
                              <div className="flex items-baseline gap-1">
                                <span className="text-xl font-bold font-mono text-white">
                                  {regData.dailyWaterGoalMl}
                                </span>
                                <span className="text-xs text-zinc-500">ml/dia</span>
                              </div>
                            </div>
                          </div>

                          <span className="text-[11px] text-zinc-500 block">
                            * Você poderá reajustar essas metas a qualquer momento nas configurações do seu perfil.
                          </span>
                        </div>
                      ) : (
                        /* USER QUESTIONS FOR PRESCRIBED GOALS */
                        <div className="space-y-3 pt-1">
                          <p className="text-xs text-zinc-300">
                            Responda às perguntas abaixo conforme o plano prescrito por seu nutricionista:
                          </p>

                          <div>
                            <label className="block text-xs text-zinc-300 mb-1">
                              1. Qual é a sua meta calórica diária prescrita? (kcal/dia)
                            </label>
                            <input
                              type="number"
                              min={1000}
                              max={7000}
                              step={50}
                              required
                              value={regData.dailyCalorieGoalKcal}
                              onChange={(e) => setRegData({ ...regData, dailyCalorieGoalKcal: Number(e.target.value) })}
                              className="w-full bg-black border border-zinc-700 text-white font-mono text-sm px-3 py-2 outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-zinc-300 mb-1">
                              2. Qual é a sua meta diária de consumo de água? (ml/dia)
                            </label>
                            <input
                              type="number"
                              min={1000}
                              max={8000}
                              step={100}
                              required
                              value={regData.dailyWaterGoalMl}
                              onChange={(e) => setRegData({ ...regData, dailyWaterGoalMl: Number(e.target.value) })}
                              className="w-full bg-black border border-zinc-700 text-white font-mono text-sm px-3 py-2 outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 4: CÓDIGO DE RECUPERAÇÃO CLARO & TERMOS */}
                {regStep === 4 && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                        Código de Recuperação da Conta
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1">
                        Se você esquecer sua senha no futuro, poderá recuperá-la facilmente informando seu e-mail cadastrado e este código de segurança (ou o seu PIN de 4 dígitos).
                      </p>
                    </div>

                    <div className="p-3.5 bg-zinc-900 border border-zinc-700 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-300 font-medium">
                          Seu Código de Recuperação:
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(generatedRecoveryKey)}
                          className="text-xs px-2 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white flex items-center gap-1"
                        >
                          {copiedKey ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedKey ? "Copiado!" : "Copiar"}</span>
                        </button>
                      </div>
                      <div className="bg-black p-2.5 border border-zinc-800 text-center font-mono text-base font-bold text-white tracking-wider select-all">
                        {generatedRecoveryKey}
                      </div>
                      <p className="text-[11px] text-zinc-500">
                        Dica: Anote este código ou guarde-o em seu bloco de notas.
                      </p>
                    </div>

                    <div className="p-3 bg-zinc-900/60 border border-zinc-800">
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          required
                          checked={regData.lgpdConsentAccepted}
                          onChange={(e) => setRegData({ ...regData, lgpdConsentAccepted: e.target.checked })}
                          className="mt-0.5 accent-white w-4 h-4 cursor-pointer"
                        />
                        <span className="text-xs text-zinc-300 leading-relaxed">
                          Concordo com o armazenamento local e privado de minhas métricas de treino e saúde no Gym Labs, com sigilo e total privacidade.
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Stepper Navigation Buttons */}
                <div className="flex items-center justify-between pt-5 border-t border-zinc-800 mt-5 text-xs">
                  {regStep > 1 ? (
                    <button
                      type="button"
                      onClick={() => setRegStep((s) => ((s - 1) as any))}
                      className="px-4 py-2 border border-zinc-700 text-zinc-300 hover:bg-zinc-900 font-medium transition-colors"
                    >
                      &larr; Voltar
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveTab("login")}
                      className="text-zinc-500 hover:text-zinc-300"
                    >
                      Já tenho uma conta
                    </button>
                  )}

                  {regStep < 4 ? (
                    <button
                      type="submit"
                      className="px-5 py-2 bg-white hover:bg-zinc-200 text-black font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <span>Avançar</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={regLoading || !regData.lgpdConsentAccepted}
                      className="px-5 py-2 bg-white hover:bg-zinc-200 text-black font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                      {regLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Criando conta...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Concluir Cadastro</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* Footer Security Badges */}
          <div className="bg-black border-t border-zinc-850 px-4 sm:px-6 py-2.5 flex items-center justify-between text-[11px] text-zinc-500">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              <span>Ambiente Seguro</span>
            </div>
            <span>Gym Labs // Health OS</span>
          </div>
        </div>
      </main>

      {/* Page Footer */}
      <footer className="border-t border-zinc-900 bg-black px-6 py-2.5 text-center text-xs text-zinc-600">
        Gym Labs — Sistema de Métricas, Treino e Saúde &copy; 2026
      </footer>
    </div>
  );
};
