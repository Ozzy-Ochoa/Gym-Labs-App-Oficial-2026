// GL AUTHENTICATION & MULTI-TENANT AUTHORIZATION MIDDLEWARE
// Enforces: Token validation, session freshness, tenant isolation.
// Guarantee: Handler receives verified userId from cryptographic session, never trust client-provided userId.

import { Request, Response, NextFunction } from "express";
import { validateSession } from "../services/authService";

export interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: any;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Acesso não autorizado: token de autenticação de sessão ausente.",
    });
  }

  const token = authHeader.substring(7).trim();
  const sessionResult = validateSession(token);

  if (!sessionResult) {
    return res.status(401).json({
      error: "Sessão inválida, revogada ou expirada. Realize novo login.",
    });
  }

  // Bind server-verified user identity
  req.userId = sessionResult.user.id;
  req.user = sessionResult.user;

  next();
}
