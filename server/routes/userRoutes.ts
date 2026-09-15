// GL USER & LGPD ROUTES // LABCORE
// Fulfills Requirements:
// 51. LGPD: Consentimento, Export My Data, Delete My Data (Direito ao Esquecimento), Transparência.
// 52. Auditoria de eventos de privacidade e remoção de dados.
// 74. Isolamento estrito de usuário.

import { Router } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/authMiddleware";
import { db } from "../database/db";
import { logSecurityEvent } from "../services/auditService";

export const userRouter = Router();

// GET /api/user/profile
userRouter.get("/profile", requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const users = db.getUsers();
  const user = users[userId];

  if (!user) {
    return res.status(404).json({ error: "Perfil de usuário não encontrado." });
  }

  const { passwordHash: _, salt: __, recoveryKeyHash: ___, ...sanitized } = user;
  return res.json({ success: true, user: sanitized });
});

// PATCH /api/user/profile
userRouter.patch("/profile", requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const users = db.getUsers();
  const user = users[userId];

  if (!user) {
    return res.status(404).json({ error: "Usuário não encontrado." });
  }

  const { name, email, profile, securitySettings } = req.body;

  if (name) user.name = String(name).trim();
  if (email) user.email = String(email).trim();
  if (profile) user.profile = { ...user.profile, ...profile };
  if (securitySettings) user.securitySettings = { ...user.securitySettings, ...securitySettings };

  user.updatedAt = new Date().toISOString();
  db.persist();

  logSecurityEvent({
    action: "SENSITIVE_DATA_MUTATION",
    userId,
    userHandle: user.handle,
    ip: req.ip || "127.0.0.1",
    userAgent: req.headers["user-agent"] || "Terminal",
    detail: "Perfil ou configurações de segurança atualizadas.",
  });

  const { passwordHash: _, salt: __, recoveryKeyHash: ___, ...sanitized } = user;
  return res.json({ success: true, user: sanitized });
});

// GET /api/user/export-my-data (LGPD Portabilidade)
userRouter.get("/export-my-data", requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const payload = db.exportUserData(userId);

  if (!payload) {
    return res.status(404).json({ error: "Dados não encontrados para exportação." });
  }

  logSecurityEvent({
    action: "DATA_EXPORT_LGPD",
    userId,
    userHandle: req.user?.handle,
    ip: req.ip || "127.0.0.1",
    userAgent: req.headers["user-agent"] || "Terminal",
    detail: "Relatório de portabilidade de dados exportado sob conformidade LGPD.",
  });

  res.setHeader("Content-Disposition", `attachment; filename=gymlabs_export_${req.user?.handle || "user"}_${Date.now()}.json`);
  res.setHeader("Content-Type", "application/json");
  return res.json(payload);
});

// POST /api/user/delete-my-data (LGPD Direito ao Esquecimento)
userRouter.post("/delete-my-data", requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const handle = req.user?.handle;

  const success = db.purgeUserData(userId);

  if (!success) {
    return res.status(500).json({ error: "Falha ao purgar dados do usuário." });
  }

  logSecurityEvent({
    action: "DATA_DELETION_LGPD",
    severity: "CRITICAL",
    userId,
    userHandle: handle,
    ip: req.ip || "127.0.0.1",
    userAgent: req.headers["user-agent"] || "Terminal",
    detail: `Exclusão total e irreversível de registros executada a pedido do operador (@${handle}).`,
  });

  return res.json({
    success: true,
    message: "Todos os seus dados foram permanentemente expurgados sob a LGPD. Sessão revogada.",
  });
});

// POST /api/user/consent
userRouter.post("/consent", requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const { consentTelemetry, consentScientificResearch, acceptedTermsDate } = req.body;

  db.setConsent(userId, {
    consentTelemetry: Boolean(consentTelemetry),
    consentScientificResearch: Boolean(consentScientificResearch),
    acceptedTermsDate: acceptedTermsDate || new Date().toISOString(),
  });

  return res.json({ success: true, consent: db.getConsent(userId) });
});

// GET /api/user/consent
userRouter.get("/consent", requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  return res.json({ success: true, consent: db.getConsent(userId) });
});
