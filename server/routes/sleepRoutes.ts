// GL SLEEP ROUTES // LABCORE
import { Router } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/authMiddleware";
import { db } from "../database/db";

export const sleepRouter = Router();

// GET /api/sleep
sleepRouter.get("/", requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const sleep = db.getUserSleep(userId);
  return res.json({ success: true, data: sleep });
});

// POST /api/sleep
sleepRouter.post("/", requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const body = req.body;

  let sleepList = db.getUserSleep(userId);
  if (!Array.isArray(sleepList)) sleepList = [];

  const newEntry = {
    ...body,
    id: body.id || "slp_" + Date.now(),
    createdAt: new Date().toISOString(),
  };

  sleepList.unshift(newEntry);
  db.setUserSleep(userId, sleepList);

  return res.status(201).json({ success: true, data: newEntry });
});
