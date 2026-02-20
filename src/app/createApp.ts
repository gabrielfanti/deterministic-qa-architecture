import express from "express";
import path from "path";
import authRoutes from "../routes/authRoutes";
import tasksRoutes from "../routes/tasksRoutes";
import healthRoutes from "../routes/healthRoutes";
import { correlationMiddleware } from "../middlewares/correlation";
import { requestLogger } from "../middlewares/requestLogger";
import { errorHandler } from "../middlewares/errorHandler";

export function createApp(): express.Express {
  const app = express();

  app.use(express.json());
  app.use(correlationMiddleware);
  app.use(requestLogger);

  app.use(healthRoutes);
  app.use("/auth", authRoutes);
  app.use("/api/tasks", tasksRoutes);

  app.get("/", (_req, res) => {
    res.sendFile(path.join(__dirname, "ui.html"));
  });

  app.get("/ui.html", (_req, res) => {
    res.sendFile(path.join(__dirname, "ui.html"));
  });

  app.use(errorHandler);
  return app;
}
