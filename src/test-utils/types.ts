export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskType = "feature" | "bug" | "chore";

export type LoginResponse = {
  userId: number;
  email: string;
  role: "admin" | "user";
  token: string;
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

export type ListTasksResponse = {
  items: Task[];
  total: number;
  page: number;
  limit: number;
};
