import { getContext } from "./context";

type Level = "info" | "warn" | "error" | "debug";

type LogData = Record<string, unknown>;

function redact(data: LogData): LogData {
  const output: LogData = {};
  for (const [key, value] of Object.entries(data)) {
    output[key] = /password|token|authorization/i.test(key) ? "[REDACTED]" : value;
  }
  return output;
}

export function log(level: Level, message: string, data: LogData = {}): void {
  const context = getContext();
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    correlationId: context?.correlationId,
    testId: context?.testId,
    userId: context?.userId,
    ...redact(data),
  };

  if (level === "error") {
    console.error(JSON.stringify(payload));
    return;
  }

  console.log(JSON.stringify(payload));
}
