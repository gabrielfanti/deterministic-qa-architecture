import express from "express";
import { forbidden, unauthorized } from "../app/errors";
import { setContext } from "../app/context";
import { getUserFromToken } from "../services/authService";
import { UserRole } from "../types/domain";

export type AuthenticatedRequest = express.Request & {
  auth?: {
    userId: number;
    email: string;
    role: UserRole;
    token: string;
  };
};

export async function requireAuth(req: express.Request, _res: express.Response, next: express.NextFunction): Promise<void> {
  const header = req.header("authorization");
  if (!header || !header.startsWith("Bearer ")) {
    unauthorized("missing bearer token");
  }

  const token = header.replace("Bearer ", "").trim();
  const user = await getUserFromToken(token);

  (req as AuthenticatedRequest).auth = user;
  setContext({ userId: user.userId });
  next();
}

export function requireRole(requiredRole: UserRole) {
  return (req: express.Request, _res: express.Response, next: express.NextFunction): void => {
    const auth = (req as AuthenticatedRequest).auth;
    if (!auth) {
      unauthorized("authentication required");
    }

    if (auth.role !== requiredRole) {
      forbidden("insufficient role");
    }

    next();
  };
}
