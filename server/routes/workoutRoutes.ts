// GL WORKOUT ROUTES // LABCORE
import { Router } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/authMiddleware";
import { db } from "../database/db";
import { validateWorkoutSessionInput } from "../validators/schemaValidators";

export const workoutRouter = Router();

// GET /api/workouts
workoutRouter.get("/", requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const workouts = db.getUserWorkouts(userId);
  return res.json({ success: true, count: workouts.length, data: workouts });
});

// POST /api/workouts
workoutRouter.post("/", requireAuth, (req: AuthenticatedRequest, res) => {
  const validation = validateWorkoutSessionInput(req.body);
  if (!validation.success) {
    return res.status(400).json({ errors: validation.errors });
  }

  const userId = req.userId!;
  const workouts = db.getUserWorkouts(userId);
  const newWorkout = {
    ...req.body,
    id: req.body.id || "wkt_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
    createdAt: new Date().toISOString(),
  };

  workouts.unshift(newWorkout);
  db.setUserWorkouts(userId, workouts);

  return res.status(201).json({ success: true, data: newWorkout });
});

// PATCH /api/workouts/:id
workoutRouter.patch("/:id", requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const workoutId = req.params.id;
  const workouts = db.getUserWorkouts(userId);

  const idx = workouts.findIndex((w) => w.id === workoutId);
  if (idx === -1) {
    return res.status(404).json({ error: "Treino não encontrado." });
  }

  workouts[idx] = {
    ...workouts[idx],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };

  db.setUserWorkouts(userId, workouts);
  return res.json({ success: true, data: workouts[idx] });
});

// DELETE /api/workouts/:id
workoutRouter.delete("/:id", requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const workoutId = req.params.id;
  let workouts = db.getUserWorkouts(userId);

  const beforeLen = workouts.length;
  workouts = workouts.filter((w) => w.id !== workoutId);

  if (workouts.length === beforeLen) {
    return res.status(404).json({ error: "Treino não encontrado." });
  }

  db.setUserWorkouts(userId, workouts);
  return res.json({ success: true, message: "Treino removido com sucesso." });
});
