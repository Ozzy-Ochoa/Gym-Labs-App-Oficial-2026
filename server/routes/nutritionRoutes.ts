// GL NUTRITION ROUTES // LABCORE
import { Router } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/authMiddleware";
import { db } from "../database/db";

export const nutritionRouter = Router();

// GET /api/nutrition
nutritionRouter.get("/", requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const nutrition = db.getUserNutrition(userId);
  return res.json({ success: true, data: nutrition });
});

// POST /api/nutrition
nutritionRouter.post("/", requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const current = db.getUserNutrition(userId) || {};
  const updated = {
    ...current,
    ...req.body,
    updatedAt: new Date().toISOString(),
  };

  db.setUserNutrition(userId, updated);
  return res.json({ success: true, data: updated });
});
