import { conflict, notFound, unprocessable } from "../app/errors";
import { query } from "../db/client";
import { Task, TaskList, TaskRow, TaskStatus, TaskType, UserRole } from "../types/domain";

type TaskListParams = {
  page?: string;
  limit?: string;
  status?: string;
  type?: string;
  q?: string;
  sort?: string;
};

type CreateTaskInput = {
  title?: string;
  description?: string | null;
  status?: string;
  type?: string;
  externalRef?: string;
  runId?: string;
};

type UpdateTaskInput = {
  title?: string;
  description?: string | null;
  status?: string;
  type?: string;
  version?: number;
};

const TASK_STATUSES: TaskStatus[] = ["todo", "in_progress", "done"];
const TASK_TYPES: TaskType[] = ["feature", "bug", "chore"];

function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    type: row.type,
    externalRef: row.external_ref,
    ownerId: row.owner_id,
    version: row.version,
    runId: row.run_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function isStatus(value?: string): value is TaskStatus {
  return !!value && TASK_STATUSES.includes(value as TaskStatus);
}

function isType(value?: string): value is TaskType {
  return !!value && TASK_TYPES.includes(value as TaskType);
}

function validateRunId(runId: string): void {
  if (!/^[A-Za-z0-9_-]{3,60}$/.test(runId)) {
    unprocessable("runId must match [A-Za-z0-9_-]{3,60}");
  }
}

function getOwnershipClause(role: UserRole, userId: number): string {
  return role === "admin" ? "TRUE" : `owner_id = ${userId}`;
}

export function parseTaskListParams(params: TaskListParams): {
  page: number;
  limit: number;
  status?: TaskStatus;
  type?: TaskType;
  q?: string;
  sort: "asc" | "desc";
} {
  const page = Number(params.page ?? 1);
  const limit = Number(params.limit ?? 10);

  if (!Number.isInteger(page) || page < 1) {
    unprocessable("page must be integer >= 1");
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    unprocessable("limit must be integer between 1 and 50");
  }

  if (params.status && !isStatus(params.status)) {
    unprocessable("status must be todo|in_progress|done");
  }

  if (params.type && !isType(params.type)) {
    unprocessable("type must be feature|bug|chore");
  }

  if (params.q !== undefined && (params.q.trim().length < 1 || params.q.length > 80)) {
    unprocessable("q must be between 1 and 80 chars");
  }

  const sort = params.sort ?? "desc";
  if (sort !== "asc" && sort !== "desc") {
    unprocessable("sort must be asc or desc");
  }

  return {
    page,
    limit,
    status: params.status as TaskStatus | undefined,
    type: params.type as TaskType | undefined,
    q: params.q?.trim() || undefined,
    sort,
  };
}

export async function listTasksForUser(
  params: ReturnType<typeof parseTaskListParams>,
  role: UserRole,
  userId: number
): Promise<TaskList> {
  const conditions: string[] = [getOwnershipClause(role, userId)];
  const values: Array<string | number> = [];

  if (params.status) {
    values.push(params.status);
    conditions.push(`status = $${values.length}`);
  }

  if (params.type) {
    values.push(params.type);
    conditions.push(`type = $${values.length}`);
  }

  if (params.q) {
    values.push(`%${params.q}%`);
    conditions.push(`(title ILIKE $${values.length} OR COALESCE(description, '') ILIKE $${values.length})`);
  }

  const where = conditions.join(" AND ");
  const totalResult = await query<{ total: number }>(`SELECT COUNT(*)::int AS total FROM tasks WHERE ${where}`, values);
  const total = totalResult.rows[0]?.total ?? 0;

  const paginatedValues = values.concat(params.limit, (params.page - 1) * params.limit);
  const itemsResult = await query<TaskRow>(
    `SELECT id, title, description, status, type, external_ref, owner_id, version, run_id, created_at, updated_at
     FROM tasks
     WHERE ${where}
     ORDER BY created_at ${params.sort}, id ${params.sort}
     LIMIT $${paginatedValues.length - 1}
     OFFSET $${paginatedValues.length}`,
    paginatedValues
  );

  return {
    items: itemsResult.rows.map(toTask),
    total,
    page: params.page,
    limit: params.limit,
  };
}

export async function createTaskForUser(input: CreateTaskInput, userId: number): Promise<Task> {
  if (!input.title || input.title.trim().length === 0) {
    unprocessable("title is required");
  }

  if (input.title.length > 120) {
    unprocessable("title max length is 120");
  }

  if (input.description !== undefined && input.description !== null && input.description.length > 400) {
    unprocessable("description max length is 400");
  }

  if (input.status && !isStatus(input.status)) {
    unprocessable("status must be todo|in_progress|done");
  }

  if (input.type && !isType(input.type)) {
    unprocessable("type must be feature|bug|chore");
  }

  const externalRef = input.externalRef ?? `task_${Date.now()}`;
  if (!/^[A-Za-z0-9_-]{3,40}$/.test(externalRef)) {
    unprocessable("externalRef must match [A-Za-z0-9_-]{3,40}");
  }

  const runId = input.runId ?? "manual";
  validateRunId(runId);

  try {
    const result = await query<TaskRow>(
      `INSERT INTO tasks (title, description, status, type, external_ref, owner_id, run_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, title, description, status, type, external_ref, owner_id, version, run_id, created_at, updated_at`,
      [
        input.title.trim(),
        input.description ?? null,
        input.status ?? "todo",
        input.type ?? "feature",
        externalRef,
        userId,
        runId,
      ]
    );

    return toTask(result.rows[0]);
  } catch (error) {
    const dbError = error as { code?: string };
    if (dbError.code === "23505") {
      conflict("duplicate externalRef");
    }
    throw error;
  }
}

export async function getTaskForUser(taskId: number, role: UserRole, userId: number): Promise<Task> {
  if (!Number.isInteger(taskId) || taskId < 1) {
    unprocessable("task id must be integer >= 1");
  }

  const result = await query<TaskRow>(
    `SELECT id, title, description, status, type, external_ref, owner_id, version, run_id, created_at, updated_at
     FROM tasks
     WHERE id = $1
       AND ${getOwnershipClause(role, userId)}`,
    [taskId]
  );

  if (!result.rows[0]) {
    notFound("task not found");
  }

  return toTask(result.rows[0]);
}

export async function updateTaskForUser(
  taskId: number,
  input: UpdateTaskInput,
  role: UserRole,
  userId: number
): Promise<Task> {
  if (!Number.isInteger(taskId) || taskId < 1) {
    unprocessable("task id must be integer >= 1");
  }

  if (!Number.isInteger(input.version) || (input.version ?? 0) < 1) {
    unprocessable("version must be positive integer");
  }

  if (input.title !== undefined && input.title.trim().length === 0) {
    unprocessable("title cannot be empty");
  }

  if (input.title !== undefined && input.title.length > 120) {
    unprocessable("title max length is 120");
  }

  if (input.description !== undefined && input.description !== null && input.description.length > 400) {
    unprocessable("description max length is 400");
  }

  if (input.status && !isStatus(input.status)) {
    unprocessable("status must be todo|in_progress|done");
  }

  if (input.type && !isType(input.type)) {
    unprocessable("type must be feature|bug|chore");
  }

  if (
    input.title === undefined &&
    input.description === undefined &&
    input.status === undefined &&
    input.type === undefined
  ) {
    unprocessable("at least one mutable field is required");
  }

  const currentResult = await query<TaskRow>(
    `SELECT id, title, description, status, type, external_ref, owner_id, version, run_id, created_at, updated_at
     FROM tasks
     WHERE id = $1 AND ${getOwnershipClause(role, userId)}`,
    [taskId]
  );

  const current = currentResult.rows[0];
  if (!current) {
    notFound("task not found");
  }

  if (current.version !== input.version) {
    conflict("version conflict");
  }

  const description = Object.prototype.hasOwnProperty.call(input, "description") ? input.description ?? null : current.description;
  const result = await query<TaskRow>(
    `UPDATE tasks
     SET title = COALESCE($1, title),
         description = $2,
         status = COALESCE($3, status),
         type = COALESCE($4, type),
         version = version + 1,
         updated_at = NOW()
     WHERE id = $5
     RETURNING id, title, description, status, type, external_ref, owner_id, version, run_id, created_at, updated_at`,
    [input.title ?? null, description, input.status ?? null, input.type ?? null, taskId]
  );

  return toTask(result.rows[0]);
}

export async function deleteTaskForUser(taskId: number, role: UserRole, userId: number): Promise<void> {
  if (!Number.isInteger(taskId) || taskId < 1) {
    unprocessable("task id must be integer >= 1");
  }

  const result = await query(
    `DELETE FROM tasks WHERE id = $1 AND ${getOwnershipClause(role, userId)}`,
    [taskId]
  );

  if ((result.rowCount ?? 0) === 0) {
    notFound("task not found");
  }
}

export async function cleanupTasksByRunId(runId: string): Promise<number> {
  validateRunId(runId);
  const result = await query("DELETE FROM tasks WHERE run_id = $1", [runId]);
  return result.rowCount ?? 0;
}
