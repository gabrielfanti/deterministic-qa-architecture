import express from "express";
import { AuthenticatedRequest, requireAuth, requireRole } from "../middlewares/auth";
import {
  cleanupTasksByRunId,
  createTaskForUser,
  deleteTaskForUser,
  getTaskForUser,
  listTasksForUser,
  parseTaskListParams,
  updateTaskForUser,
} from "../services/taskService";

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  const auth = (req as AuthenticatedRequest).auth;
  const params = parseTaskListParams(req.query as Record<string, string | undefined>);
  const result = await listTasksForUser(params, auth!.role, auth!.userId);
  res.json(result);
});

router.post("/", requireAuth, async (req, res) => {
  const auth = (req as AuthenticatedRequest).auth;
  const task = await createTaskForUser(req.body, auth!.userId);
  res.status(201).json(task);
});

router.delete("/testing/run/:runId", requireAuth, requireRole("admin"), async (req, res) => {
  const deleted = await cleanupTasksByRunId(String(req.params.runId));
  res.json({ deleted });
});

router.get("/:id", requireAuth, async (req, res) => {
  const auth = (req as AuthenticatedRequest).auth;
  const task = await getTaskForUser(Number(req.params.id), auth!.role, auth!.userId);
  res.json(task);
});

router.patch("/:id", requireAuth, async (req, res) => {
  const auth = (req as AuthenticatedRequest).auth;
  const task = await updateTaskForUser(Number(req.params.id), req.body, auth!.role, auth!.userId);
  res.json(task);
});

router.delete("/:id", requireAuth, async (req, res) => {
  const auth = (req as AuthenticatedRequest).auth;
  await deleteTaskForUser(Number(req.params.id), auth!.role, auth!.userId);
  res.status(204).send();
});

export default router;
