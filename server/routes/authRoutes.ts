// GL AUTH ROUTES // LABCORE
import { Router } from "express";
import {
  registerUser,
  authenticateUser,
  validateSession,
  revokeSession,
  refreshSession,
} from "../services/authService";
import {
  validateRegisterInput,
  validateLoginInput,
} from "../validators/schemaValidators";
import {
  loginRateLimiter,
  registerRateLimiter,
  totpRateLimiter,
} from "../middleware/rateLimiter";
import { logSecurityEvent } from "../services/auditService";

export const authRouter = Router();

// POST /api/auth/register
authRouter.post("/register", registerRateLimiter, async (req, res) => {
  const validation = validateRegisterInput(req.body);
  if (!validation.success || !validation.data) {
    return res.status(400).json({ errors: validation.errors });
  }

  try {
    const result = await registerUser({
      ...validation.data,
      ip: req.ip || req.socket.remoteAddress || "127.0.0.1",
      userAgent: req.headers["user-agent"] || "Terminal Desktop",
    });

    return res.status(201).json({
      success: true,
      user: result.user,
      token: result.token,
      recoveryKey: result.recoveryKey,
      message: "Operador registrado com sucesso no enclave de segurança.",
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Erro no registro de usuário." });
  }
});

// POST /api/auth/login
authRouter.post("/login", loginRateLimiter, async (req, res) => {
  const validation = validateLoginInput(req.body);
  if (!validation.success || !validation.data) {
    return res.status(400).json({ errors: validation.errors });
  }

  const ip = req.ip || req.socket.remoteAddress || "127.0.0.1";
  const deviceInfo = req.headers["user-agent"] || "Terminal Desktop";

  try {
    const result = await authenticateUser({
      ...validation.data,
      deviceInfo,
      ip,
    });

    return res.json({
      success: true,
      user: result.user,
      token: result.token,
      expiresAt: result.session.expiresAt,
      nonce: result.session.nonce,
    });
  } catch (err: any) {
    const isTotpPrompt = err.message === "TOTP_REQUIRED";
    return res.status(isTotpPrompt ? 403 : 401).json({
      error: err.message || "Falha na autenticação.",
      totpRequired: isTotpPrompt,
    });
  }
});

// GET /api/auth/session
authRouter.get("/session", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token de sessão ausente." });
  }

  const token = authHeader.substring(7).trim();
  const session = validateSession(token);

  if (!session) {
    return res.status(401).json({ error: "Sessão expirada ou revogada." });
  }

  return res.json({
    authenticated: true,
    user: session.user,
    session: {
      expiresAt: session.session.expiresAt,
      lastActiveAt: session.session.lastActiveAt,
      deviceInfo: session.session.deviceInfo,
    },
  });
});

// POST /api/auth/refresh
authRouter.post("/refresh", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token ausente." });
  }

  const token = authHeader.substring(7).trim();
  const newSession = refreshSession(token);

  if (!newSession) {
    return res.status(401).json({ error: "Impossível renovar sessão expirada." });
  }

  return res.json({
    success: true,
    token: newSession.token,
    expiresAt: newSession.expiresAt,
  });
});

// POST /api/auth/logout
authRouter.post("/logout", (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    const validated = validateSession(token);
    if (validated) {
      logSecurityEvent({
        action: "AUTH_LOGOUT",
        userId: validated.user.id,
        userHandle: validated.user.handle,
        ip: req.ip || req.socket.remoteAddress || "127.0.0.1",
        userAgent: req.headers["user-agent"] || "Terminal",
        detail: "Sessão encerrada voluntariamente pelo operador.",
      });
    }
    revokeSession(token);
  }
  return res.json({ success: true, message: "Sessão revogada com sucesso." });
});
