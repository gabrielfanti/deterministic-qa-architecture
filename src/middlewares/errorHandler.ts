import express from "express";
import { getContext } from "../app/context";
import { AppError } from "../app/errors";
import { log } from "../app/logger";

type PgError = {
  code?: string;
  message?: string;
};

function fromKnownPgError(error: PgError): AppError | null {
  if (error.code === "23505") {
    return new AppError(409, "conflict", "resource conflict");
  }
  return null;
}

export function errorHandler(err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction): void {
  void next;
  const correlationId = getContext()?.correlationId;

  if (err instanceof AppError) {
    log("warn", "http.app_error", { status: err.status, code: err.code, message: err.message, stack: err.stack });
    res.status(err.status).json({ error: { code: err.code, message: err.message, correlationId } });
    return;
  }

  const pgMapped = fromKnownPgError(err as PgError);
  if (pgMapped) {
    res.status(pgMapped.status).json({ error: { code: pgMapped.code, message: pgMapped.message, correlationId } });
    return;
  }

  const unknown = err as Error;
  log("error", "http.unhandled_error", {
    message: unknown?.message,
    stack: unknown?.stack,
  });

  res.status(500).json({
    error: {
      code: "internal_server_error",
      message: "Unexpected internal error",
      correlationId,
    },
  });
}
