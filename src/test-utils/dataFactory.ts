import { testId, RUN_ID } from "./testRun";
import { TaskStatus, TaskType } from "./types";

export function buildTaskPayload(overrides: Partial<{
  title: string;
  description: string | null;
  status: TaskStatus;
  type: TaskType;
  externalRef: string;
  runId: string;
}> = {}) {
  const id = testId("task");
  const externalRef = overrides.externalRef ?? `ext_${id}`.slice(0, 40);
  return {
    title: overrides.title ?? `Task ${id}`,
    description: overrides.description ?? `Description ${id}`,
    status: overrides.status ?? "todo",
    type: overrides.type ?? "feature",
    externalRef,
    runId: overrides.runId ?? RUN_ID,
  };
}
