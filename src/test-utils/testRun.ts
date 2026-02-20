const MAX_ID_LENGTH = 56;
const SHORT_RUN_LENGTH = 20;

function compactNow(): string {
  return Date.now().toString(36);
}

function compactRand(): string {
  return Math.random().toString(36).slice(2, 8);
}

function clip(value: string, max: number): string {
  return value.length > max ? value.slice(0, max) : value;
}

const envRunId = process.env.TEST_RUN_ID?.replace(/[^A-Za-z0-9_-]/g, "_");
export const RUN_ID = clip(envRunId && envRunId.length >= 3 ? envRunId : `run_${compactNow()}${compactRand()}`, SHORT_RUN_LENGTH);

export function testId(prefix: string): string {
  const safePrefix = clip(prefix.replace(/[^A-Za-z0-9_-]/g, "_"), 16);
  return clip(`${RUN_ID}_${safePrefix}_${compactNow()}${compactRand()}`, MAX_ID_LENGTH);
}
