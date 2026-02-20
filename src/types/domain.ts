export const TASK_STATUSES = ["todo", "in_progress", "done"] as const;
export const TASK_TYPES = ["feature", "bug", "chore"] as const;
export const USER_ROLES = ["admin", "user"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskType = (typeof TASK_TYPES)[number];
export type UserRole = (typeof USER_ROLES)[number];

export type UserRecord = {
  id: number;
  email: string;
  password: string;
  role: UserRole;
  api_token: string;
};

export type AuthUser = {
  userId: number;
  email: string;
  role: UserRole;
  token: string;
};

export type TaskRow = {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  type: TaskType;
  external_ref: string;
  owner_id: number;
  version: number;
  run_id: string;
  created_at: string;
  updated_at: string;
};

export type Task = {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  type: TaskType;
  externalRef: string;
  ownerId: number;
  version: number;
  runId: string;
  createdAt: string;
  updatedAt: string;
};

export type TaskList = {
  items: Task[];
  total: number;
  page: number;
  limit: number;
};
