import express from "express";
import { log } from "../app/logger";

export function requestLogger(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const startedAt = Date.now();

  res.on("finish", () => {
    log("info", "http.request", {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
      query: req.query,
    });
  });

  next();
}
