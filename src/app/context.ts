import { AsyncLocalStorage } from "node:async_hooks";

export type RequestContext = {
  correlationId: string;
  testId?: string;
  userId?: number;
};

const store = new AsyncLocalStorage<RequestContext>();

export function runWithContext<T>(context: RequestContext, callback: () => T): T {
  return store.run(context, callback);
}

export function getContext(): RequestContext | undefined {
  return store.getStore();
}

export function setContext(values: Partial<RequestContext>): void {
  const existing = store.getStore();
  if (!existing) return;
  Object.assign(existing, values);
}
