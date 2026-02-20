import express from "express";
import { isDatabaseHealthy } from "../db/client";

const router = express.Router();

router.get("/health", async (_req, res) => {
  const dbHealthy = await isDatabaseHealthy();

  if (!dbHealthy) {
    res.status(503).json({
      ok: false,
      db: false,
      error: "database unavailable",
    });
    return;
  }

  res.status(200).json({ ok: true, db: true });
});

export default router;
