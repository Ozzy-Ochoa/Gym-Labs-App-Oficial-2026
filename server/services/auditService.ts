// GL AUDIT LOG SERVICE // LABCORE COMPLIANCE & ZERO-LEAK SECURITY
// Standards: SOC-2 / ISO 27001 / LGPD Audit Trail
// Security Rule: NEVER LOG PASSWORDS, TOTP SECRETS, RECOVERY KEYS, OR RAW TOKENS.

import crypto from "crypto";
import { db } from "../database/db";

export type AuditAction =
  | "AUTH_LOGIN_SUCCESS"
  | "AUTH_LOGIN_FAILURE"
  | "AUTH_LOGOUT"
  | "AUTH_PASSWORD_CHANGE"
  | "AUTH_2FA_ENABLE"
  | "AUTH_2FA_DISABLE"
  | "AUTH_2FA_VERIFY_FAILURE"
  | "AUTH_RECOVERY_USE"
  | "SENSITIVE_DATA_MUTATION"
  | "DATA_EXPORT_LGPD"
  | "DATA_DELETION_LGPD"
  | "SECURITY_LOCKOUT";

export interface AuditRecord {
  id: string;
  timestamp: string;
  userId?: string;
  userHandle?: string;
  action: AuditAction;
  severity: "INFO" | "WARNING" | "CRITICAL";
  ip: string;
  userAgent: string;
  detail: string;
}

export function logSecurityEvent(params: {
  action: AuditAction;
  severity?: "INFO" | "WARNING" | "CRITICAL";
  userId?: string;
  userHandle?: string;
  ip?: string;
  userAgent?: string;
  detail: string;
}) {
  const {
    action,
    severity = "INFO",
    userId,
    userHandle,
    ip = "127.0.0.1",
    userAgent = "Terminal Core",
    detail,
  } = params;

  // Sanitization check: Ensure no secrets leak in detail string
  let cleanDetail = detail;
  if (/password|secret|totp|bearer|key/i.test(cleanDetail)) {
    // Redact potential values
    cleanDetail = cleanDetail.replace(/(password|secret|totp|bearer|key)=([^\s&]+)/gi, "$1=[REDACTED]");
  }

  const record: AuditRecord = {
    id: "aud_" + Date.now() + "_" + crypto.randomBytes(4).toString("hex"),
    timestamp: new Date().toISOString(),
    userId,
    userHandle,
    action,
    severity,
    ip,
    userAgent,
    detail: cleanDetail,
  };

  db.addAuditLog(record);
}
