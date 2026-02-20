import dotenv from "dotenv";

dotenv.config();

function requireString(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parsePort(value: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(`Invalid PORT value: ${value}`);
  }
  return parsed;
}

export type AppEnv = {
  port: number;
  databaseUrl: string;
  dbDebug: boolean;
};

export const env: AppEnv = {
  port: parsePort(process.env.PORT ?? "3000"),
  databaseUrl: requireString("DATABASE_URL"),
  dbDebug: process.env.DB_DEBUG === "true",
};
