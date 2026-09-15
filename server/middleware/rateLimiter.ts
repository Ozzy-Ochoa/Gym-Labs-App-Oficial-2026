// GL RATE LIMITING & BRUTE FORCE PROTECTION MIDDLEWARE // LABCORE
// Protects sensitive endpoints: /auth/login, /auth/2fa, /auth/register, /auth/recovery, /api/intelligence.

import { Request, Response, NextFunction } from "express";

interface RateLimitBucket {
  hits: number;
  resetTime: number;
  lockedUntil?: number;
}

const buckets = new Map<string, RateLimitBucket>();

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  lockoutMs?: number;
  keyGenerator?: (req: Request) => string;
  errorMessage?: string;
}

export function createRateLimiter(config: RateLimitConfig) {
  const {
    maxRequests,
    windowMs,
    lockoutMs = 15 * 60 * 1000,
    keyGenerator = (req) => req.ip || req.socket.remoteAddress || "127.0.0.1",
    errorMessage = "Limite de requisições excedido. Tente novamente mais tarde.",
  } = config;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();

    let bucket = buckets.get(key);

    if (!bucket || bucket.resetTime <= now) {
      bucket = {
        hits: 1,
        resetTime: now + windowMs,
      };
      buckets.set(key, bucket);
      return next();
    }

    // Check if under lockout penalty
    if (bucket.lockedUntil && bucket.lockedUntil > now) {
      const waitSec = Math.ceil((bucket.lockedUntil - now) / 1000);
      return res.status(429).json({
        error: `Terminal bloqueado por segurança devido a excesso de tentativas. Aguarde ${waitSec} segundos.`,
        retryAfter: waitSec,
      });
    }

    bucket.hits++;

    if (bucket.hits > maxRequests) {
      bucket.lockedUntil = now + lockoutMs;
      const waitSec = Math.ceil(lockoutMs / 1000);
      return res.status(429).json({
        error: errorMessage,
        retryAfter: waitSec,
      });
    }

    return next();
  };
}

// Pre-configured rate limiters
export const loginRateLimiter = createRateLimiter({
  maxRequests: 5,
  windowMs: 60 * 1000, // 5 requests per minute
  lockoutMs: 15 * 60 * 1000, // 15 min lock
  keyGenerator: (req) => {
    const ident = (req.body?.handleOrEmail || "").toLowerCase().trim();
    const ip = req.ip || req.socket.remoteAddress || "127.0.0.1";
    return `login_${ident}_${ip}`;
  },
  errorMessage: "Múltiplas falhas de autenticação. Terminal bloqueado por 15 minutos.",
});

export const totpRateLimiter = createRateLimiter({
  maxRequests: 3,
  windowMs: 30 * 1000,
  lockoutMs: 5 * 60 * 1000,
  errorMessage: "Muitas tentativas de código TOTP. Aguarde 5 minutos.",
});

export const registerRateLimiter = createRateLimiter({
  maxRequests: 5,
  windowMs: 60 * 60 * 1000, // 5 per hour per IP
  errorMessage: "Limite de criação de contas por hora atingido.",
});

export const recoveryRateLimiter = createRateLimiter({
  maxRequests: 3,
  windowMs: 60 * 60 * 1000,
  lockoutMs: 30 * 60 * 1000,
  errorMessage: "Muitas tentativas de recuperação de acesso. Aguarde 30 minutos.",
});

export const intelligenceRateLimiter = createRateLimiter({
  maxRequests: 20,
  windowMs: 60 * 1000, // 20 requests per minute
  lockoutMs: 60 * 1000,
  errorMessage: "Limite de consultas por minuto à inteligência GL atingido. Aguarde 1 minuto.",
});
