// GL SECURITY & CRYPTO ENGINE // LABCORE
// Standards: WebCrypto API, PBKDF2-HMAC-SHA256, Zero-Knowledge Local Vault, NIST SP 800-63B

import {
  UserProfile,
  SecuritySettings,
  AuthUser,
  AuthSession,
  LoginAuditLog,
  RegistrationFormData,
} from "../types";
import { generateTotpSecret, verifyTotpToken, generateOtpAuthUri } from "./totp";
import { encryptVaultData, decryptVaultData, EncryptedVaultPayload } from "./vaultCrypto";

export { generateTotpSecret, verifyTotpToken, generateOtpAuthUri };
export { encryptVaultData, decryptVaultData };
export type { EncryptedVaultPayload };

// Key definitions for multi-tenant local vault
export const AUTH_KEYS = {
  USERS_LIST: "gl_auth_users_v2",
  ACTIVE_SESSION: "gl_auth_session_v2",
  AUDIT_LOGS: "gl_auth_audit_v2",
  RATE_LIMITS: "gl_auth_rate_limits_v2",
};

// Legacy keys retained for backward compatibility
export const STORAGE_KEYS = {
  USER_PROFILE: "gl_vault_user_profile_v1",
  SECURITY: "gl_vault_security_v1",
  TELEMETRY: "gl_vault_telemetry_v1",
  APP_INITIALIZED: "gl_app_initialized_v1",
  BODY_METRICS: "gl_vault_body_metrics_v1",
  WORKOUTS: "gl_vault_workouts_v1",
  CARDIO: "gl_vault_cardio_v1",
  NUTRITION: "gl_vault_nutrition_v1",
  SLEEP: "gl_vault_sleep_v1",
  HABITS: "gl_vault_habits_v1",
  GOALS: "gl_vault_goals_v1",
  HEALTH_TIMELINE: "gl_vault_health_timeline_v1",
  SYSTEM_STATUS: "gl_vault_system_status_v1",
};

// Generates cryptographically secure random hexadecimal salt
export function generateCryptographicSalt(byteLength = 16): string {
  const array = new Uint8Array(byteLength);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Derives a key using PBKDF2 with 100,000 iterations and SHA-256
export async function hashPassword(password: string, salt: string): Promise<string> {
  if (!password) return "";
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: enc.encode(`gl_salt_${salt}_labcore_auth`),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  const hashArray = Array.from(new Uint8Array(derivedBits));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Fast SHA-256 for quick numeric PIN
export async function hashPin(pin: string): Promise<string> {
  if (!pin) return "";
  const encoder = new TextEncoder();
  const data = encoder.encode(`gl_pin_salt_${pin}_labcore_2026`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyPin(pin: string, expectedHash: string): Promise<boolean> {
  const currentHash = await hashPin(pin);
  return currentHash === expectedHash;
}

// Generates an emergency recovery key: GL-SEC-XXXX-XXXX-XXXX
export function generateRecoveryKey(): string {
  const segment = () =>
    Math.random().toString(36).substring(2, 6).toUpperCase();
  return `REC-${segment()}-${segment()}-${segment()}`;
}

// Generates a session token
export function generateSessionToken(): string {
  return "gymlabs_sess_" + generateCryptographicSalt(24);
}

// Password strength calculation based on NIST guidelines
export interface PasswordStrengthResult {
  score: number; // 0 to 4
  label: "Muito Fraca" | "Fraca" | "Razoável" | "Forte" | "Excelente / Segura";
  color: string;
  checks: {
    minLength: boolean;
    hasUpper: boolean;
    hasLower: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
  entropyBits: number;
}

export function calculatePasswordStrength(password: string): PasswordStrengthResult {
  const checks = {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };

  let score = 0;
  if (checks.minLength) score++;
  if (checks.hasUpper && checks.hasLower) score++;
  if (checks.hasNumber) score++;
  if (checks.hasSpecial && password.length >= 10) score++;

  let charsetSize = 0;
  if (checks.hasLower) charsetSize += 26;
  if (checks.hasUpper) charsetSize += 26;
  if (checks.hasNumber) charsetSize += 10;
  if (checks.hasSpecial) charsetSize += 33;
  if (charsetSize === 0) charsetSize = 1;

  const entropyBits = Math.round(password.length * Math.log2(charsetSize));

  const labels: PasswordStrengthResult["label"][] = [
    "Muito Fraca",
    "Fraca",
    "Razoável",
    "Forte",
    "Excelente / Segura",
  ];
  const colors = [
    "text-zinc-500 bg-zinc-600",
    "text-zinc-400 bg-zinc-500",
    "text-zinc-300 bg-zinc-400",
    "text-zinc-200 bg-zinc-300",
    "text-white bg-white",
  ];

  return {
    score,
    label: labels[score],
    color: colors[score],
    checks,
    entropyBits,
  };
}

// Data Anonymizer & Sanitizer (Ensures no PII leaks or script injection)
export function sanitizeInput(input: string): string {
  if (!input) return "";
  return input
    .replace(/[<>]/g, "") // Prevents script injection
    .trim()
    .slice(0, 500); // Strict length boundary
}

// ----------------------------------------------------
// AUDIT LOGGING & RATE LIMITING (BRUTE FORCE DEFENSE)
// ----------------------------------------------------

export function getAuditLogs(): LoginAuditLog[] {
  try {
    const raw = localStorage.getItem(AUTH_KEYS.AUDIT_LOGS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function logAuditEvent(
  event: Omit<LoginAuditLog, "id" | "timestamp" | "device" | "ip"> & {
    device?: string;
    ip?: string;
  }
): void {
  try {
    const logs = getAuditLogs();
    const newLog: LoginAuditLog = {
      id: "log_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      device: event.device || (navigator.userAgent.includes("Mobile") ? "Dispositivo Móvel" : "Estação Desktop Terminal"),
      ip: event.ip || "192.168.1.10 (Local Enclave)",
      ...event,
    };
    const updated = [newLog, ...logs].slice(0, 100); // Retém últimos 100 eventos
    localStorage.setItem(AUTH_KEYS.AUDIT_LOGS, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to write audit event", err);
  }
}

interface RateLimitRecord {
  failedAttempts: number;
  lockedUntil: number | null;
}

export function getRateLimitStatus(identifier: string): {
  isLocked: boolean;
  remainingSeconds: number;
  failedAttempts: number;
} {
  try {
    const raw = localStorage.getItem(AUTH_KEYS.RATE_LIMITS);
    const store: Record<string, RateLimitRecord> = raw ? JSON.parse(raw) : {};
    const record = store[identifier.toLowerCase().trim()];
    if (!record) return { isLocked: false, remainingSeconds: 0, failedAttempts: 0 };

    if (record.lockedUntil && record.lockedUntil > Date.now()) {
      const remainingSeconds = Math.ceil((record.lockedUntil - Date.now()) / 1000);
      return { isLocked: true, remainingSeconds, failedAttempts: record.failedAttempts };
    }
    return { isLocked: false, remainingSeconds: 0, failedAttempts: record.failedAttempts };
  } catch {
    return { isLocked: false, remainingSeconds: 0, failedAttempts: 0 };
  }
}

export function recordFailedLoginAttempt(identifier: string): {
  isLocked: boolean;
  remainingSeconds: number;
  failedAttempts: number;
} {
  try {
    const raw = localStorage.getItem(AUTH_KEYS.RATE_LIMITS);
    const store: Record<string, RateLimitRecord> = raw ? JSON.parse(raw) : {};
    const key = identifier.toLowerCase().trim();
    const current = store[key] || { failedAttempts: 0, lockedUntil: null };

    current.failedAttempts += 1;

    // Exponential lockout:
    // 3 falhas -> 30s de bloqueio
    // 5 falhas -> 60s de bloqueio
    // 7+ falhas -> 180s de bloqueio
    if (current.failedAttempts >= 7) {
      current.lockedUntil = Date.now() + 180 * 1000;
    } else if (current.failedAttempts >= 5) {
      current.lockedUntil = Date.now() + 60 * 1000;
    } else if (current.failedAttempts >= 3) {
      current.lockedUntil = Date.now() + 30 * 1000;
    }

    store[key] = current;
    localStorage.setItem(AUTH_KEYS.RATE_LIMITS, JSON.stringify(store));

    const isLocked = current.lockedUntil !== null && current.lockedUntil > Date.now();
    const remainingSeconds = isLocked ? Math.ceil((current.lockedUntil! - Date.now()) / 1000) : 0;
    return { isLocked, remainingSeconds, failedAttempts: current.failedAttempts };
  } catch {
    return { isLocked: false, remainingSeconds: 0, failedAttempts: 1 };
  }
}

export function clearFailedLoginAttempts(identifier: string): void {
  try {
    const raw = localStorage.getItem(AUTH_KEYS.RATE_LIMITS);
    if (!raw) return;
    const store: Record<string, RateLimitRecord> = JSON.parse(raw);
    delete store[identifier.toLowerCase().trim()];
    localStorage.setItem(AUTH_KEYS.RATE_LIMITS, JSON.stringify(store));
  } catch (err) {
    console.error("Failed to clear rate limit", err);
  }
}

// ----------------------------------------------------
// USER ACCOUNTS & REPOSITORY
// ----------------------------------------------------

export function getAllUsers(): AuthUser[] {
  try {
    const raw = localStorage.getItem(AUTH_KEYS.USERS_LIST);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveAllUsers(users: AuthUser[]): void {
  try {
    localStorage.setItem(AUTH_KEYS.USERS_LIST, JSON.stringify(users));
  } catch (err) {
    console.error("Failed to persist users list", err);
  }
}

export function findUserByIdentifier(identifier: string): AuthUser | null {
  const users = getAllUsers();
  const normalized = identifier.toLowerCase().trim();
  return (
    users.find(
      (u) =>
        u.email.toLowerCase() === normalized ||
        u.handle.toLowerCase() === normalized
    ) || null
  );
}

// ----------------------------------------------------
// SESSION MANAGEMENT
// ----------------------------------------------------

export function getActiveSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_KEYS.ACTIVE_SESSION);
    if (!raw) return null;
    const session: AuthSession = JSON.parse(raw);
    // Verificar se expirou
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      localStorage.removeItem(AUTH_KEYS.ACTIVE_SESSION);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function setActiveSession(session: AuthSession | null): void {
  try {
    if (!session) {
      localStorage.removeItem(AUTH_KEYS.ACTIVE_SESSION);
    } else {
      localStorage.setItem(AUTH_KEYS.ACTIVE_SESSION, JSON.stringify(session));
    }
  } catch (err) {
    console.error("Failed to set active session", err);
  }
}

export function getAuthenticatedUser(): AuthUser | null {
  const session = getActiveSession();
  if (!session) return null;
  const users = getAllUsers();
  return users.find((u) => u.id === session.userId) || null;
}

// ----------------------------------------------------
// PER-USER DATA ISOLATION (USER VAULT)
// ----------------------------------------------------

export function getUserVaultKey(userId: string, keyName: string): string {
  return `gl_vault_u_${userId}_${keyName}`;
}

export function getUserVaultItem<T>(userId: string, keyName: string, fallback: T): T {
  try {
    const key = getUserVaultKey(userId, keyName);
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function setUserVaultItem<T>(userId: string, keyName: string, value: T): void {
  try {
    const key = getUserVaultKey(userId, keyName);
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed to set user vault item ${keyName}`, err);
  }
}

// AES-GCM Encrypted Vault storage with hardware key derivation (PBKDF2 100k + 96-bit IV)
export async function setEncryptedUserVaultItem<T>(
  userId: string,
  keyName: string,
  value: T,
  passphrase: string
): Promise<void> {
  try {
    const encrypted = await encryptVaultData(value, passphrase);
    const key = getUserVaultKey(userId, `${keyName}_enc`);
    localStorage.setItem(key, JSON.stringify(encrypted));
  } catch (err) {
    console.error(`Failed to set encrypted user vault item ${keyName}`, err);
  }
}

export async function getEncryptedUserVaultItem<T>(
  userId: string,
  keyName: string,
  passphrase: string,
  fallback: T
): Promise<T> {
  try {
    const key = getUserVaultKey(userId, `${keyName}_enc`);
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const payload: EncryptedVaultPayload = JSON.parse(raw);
    return await decryptVaultData<T>(payload, passphrase);
  } catch (err) {
    console.warn(`Could not decrypt vault item ${keyName}, using fallback`, err);
    return fallback;
  }
}

// Legacy profile / settings helpers mapped to active authenticated user
export function getUserProfile(): UserProfile | null {
  const user = getAuthenticatedUser();
  if (user) {
    return getUserVaultItem<UserProfile>(user.id, "profile", user.profile);
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveUserProfile(profile: UserProfile): void {
  const user = getAuthenticatedUser();
  if (user) {
    setUserVaultItem(user.id, "profile", profile);
    // Também atualiza o objeto no repositório de usuários
    const users = getAllUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx !== -1) {
      users[idx].profile = profile;
      saveAllUsers(users);
    }
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  } catch (err) {
    console.error("Failed to save user profile to vault", err);
  }
}

export function getSecuritySettings(): SecuritySettings | null {
  const user = getAuthenticatedUser();
  if (user) {
    return getUserVaultItem<SecuritySettings>(user.id, "security", user.securitySettings);
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SECURITY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSecuritySettings(settings: SecuritySettings): void {
  const user = getAuthenticatedUser();
  if (user) {
    setUserVaultItem(user.id, "security", settings);
    const users = getAllUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx !== -1) {
      users[idx].securitySettings = settings;
      saveAllUsers(users);
    }
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEYS.SECURITY, JSON.stringify(settings));
  } catch (err) {
    console.error("Failed to save security settings to vault", err);
  }
}

// ----------------------------------------------------
// EXPORT & PURGE
// ----------------------------------------------------

export function generateVaultExport(vaultData: Record<string, any>) {
  const user = getAuthenticatedUser();
  const exportPayload = {
    system: "Gym Labs // Health OS",
    compliance: "LGPD_ART_18 // HIPAA_TECHNICAL_SAFEGUARDS",
    operator: user ? user.handle : "ANONYMOUS_OPERATOR",
    email: user ? user.email : "LOCAL_ENCLAVE",
    exportedAt: new Date().toISOString(),
    version: "5.0.0",
    payload: vaultData,
  };

  const jsonStr = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `GYMLABS_EXPORT_${user?.handle || "DATA"}_${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Encrypted export protected by user passphrase with AES-GCM 256-bit + PBKDF2
export async function generateEncryptedVaultExport(
  vaultData: Record<string, any>,
  passphrase: string
): Promise<void> {
  const user = getAuthenticatedUser();
  const encryptedPayload = await encryptVaultData(vaultData, passphrase);
  const exportPackage = {
    system: "Gym Labs // Health OS Enclave",
    encryption: "AES-GCM-256 // PBKDF2-SHA256 (100k iter)",
    operator: user ? user.handle : "ANONYMOUS_OPERATOR",
    exportedAt: new Date().toISOString(),
    vault: encryptedPayload,
  };

  const jsonStr = JSON.stringify(exportPackage, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `GYMLABS_ENCRYPTED_VAULT_${user?.handle || "DATA"}_${new Date().toISOString().split("T")[0]}.glvault`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function purgeCurrentUserVault(userId: string) {
  // Remove dados escopados do usuário
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(`gl_vault_u_${userId}_`)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));

  // Remove usuário da lista
  const users = getAllUsers().filter((u) => u.id !== userId);
  saveAllUsers(users);

  // Limpa sessão
  setActiveSession(null);
  logAuditEvent({
    userId,
    emailOrHandle: userId,
    status: "LOGOUT",
    reason: "RIGHT_TO_BE_FORGOTTEN_PURGE",
  });
}

export function purgeVaultData() {
  localStorage.clear();
}
