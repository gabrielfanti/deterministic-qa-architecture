import { Pool, QueryResult, QueryResultRow } from "pg";
import { env } from "../config/env";
import { getContext } from "../app/context";
import { log } from "../app/logger";

const pool = new Pool({ connectionString: env.databaseUrl });

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<QueryResult<T>> {
  const startedAt = Date.now();
  const result = await pool.query<T>(text, params);

  if (env.dbDebug) {
    log("debug", "db.query", {
      statement: text.replace(/\s+/g, " ").trim(),
      durationMs: Date.now() - startedAt,
      rowCount: result.rowCount,
      paramCount: params.length,
      correlationId: getContext()?.correlationId,
      testId: getContext()?.testId,
    });
  }

  return result;
}

export async function isDatabaseHealthy(): Promise<boolean> {
  try {
    const result = await query<{ ok: number }>("SELECT 1 AS ok");
    return result.rows[0]?.ok === 1;
  } catch {
    return false;
  }
}
