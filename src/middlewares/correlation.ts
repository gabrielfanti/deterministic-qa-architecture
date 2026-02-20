import { randomUUID } from "node:crypto";
import express from "express";
import { runWithContext } from "../app/context";

export function correlationMiddleware(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const correlationId = req.header("x-correlation-id") ?? randomUUID();
  const testId = req.header("x-test-id") ?? undefined;

  res.setHeader("x-correlation-id", correlationId);
  runWithContext({ correlationId, testId }, () => next());
}
