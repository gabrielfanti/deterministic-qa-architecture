import { query } from "../db/client";
import { AppError, unauthorized, unprocessable } from "../app/errors";
import { AuthUser, UserRecord } from "../types/domain";

export async function login(email?: string, password?: string): Promise<AuthUser> {
  if (!email || !password) {
    unprocessable("email and password are required");
  }

  const result = await query<UserRecord>(
    `SELECT id, email, password, role, api_token
     FROM users
     WHERE email = $1 AND password = $2`,
    [email, password]
  );

  const user = result.rows[0];
  if (!user) {
    throw new AppError(401, "invalid_credentials", "invalid credentials");
  }

  return {
    userId: user.id,
    email: user.email,
    role: user.role,
    token: user.api_token,
  };
}

export async function getUserFromToken(token?: string): Promise<AuthUser> {
  if (!token) {
    unauthorized("missing bearer token");
  }

  const result = await query<UserRecord>(
    `SELECT id, email, password, role, api_token
     FROM users
     WHERE api_token = $1`,
    [token]
  );

  const user = result.rows[0];
  if (!user) {
    unauthorized("invalid token");
  }

  return {
    userId: user.id,
    email: user.email,
    role: user.role,
    token: user.api_token,
  };
}
