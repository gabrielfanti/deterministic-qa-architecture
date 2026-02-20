import { APIRequestContext, APIResponse, expect } from "@playwright/test";
import { LoginResponse } from "./types";
import { testId } from "./testRun";

type RequestOptions = {
  token?: string;
  testName?: string;
  query?: Record<string, string | number | undefined>;
  data?: unknown;
  expectedStatus?: number;
};

function toQueryString(query?: Record<string, string | number | undefined>): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.append(key, String(value));
  }
  const encoded = params.toString();
  return encoded ? `?${encoded}` : "";
}

export class ApiClient {
  constructor(private readonly request: APIRequestContext) {}

  private async send(method: string, path: string, options: RequestOptions = {}): Promise<APIResponse> {
    const correlationId = testId("corr");
    const currentTestId = options.testName ? testId(options.testName) : testId("test");
    const headers: Record<string, string> = {
      "x-correlation-id": correlationId,
      "x-test-id": currentTestId,
    };

    if (options.token) {
      headers.authorization = `Bearer ${options.token}`;
    }

    const response = await this.request.fetch(`${path}${toQueryString(options.query)}`, {
      method,
      headers,
      data: options.data,
    });

    if (typeof options.expectedStatus === "number") {
      expect(response.status(), `Expected ${options.expectedStatus} for ${method} ${path}`).toBe(options.expectedStatus);
    }

    return response;
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await this.send("POST", "/auth/login", { data: { email, password }, expectedStatus: 200 });
    return response.json();
  }

  async createTask(token: string, data: unknown, expectedStatus = 201): Promise<APIResponse> {
    return this.send("POST", "/api/tasks", { token, data, expectedStatus });
  }

  async getTask(token: string, taskId: number, expectedStatus = 200): Promise<APIResponse> {
    return this.send("GET", `/api/tasks/${taskId}`, { token, expectedStatus });
  }

  async listTasks(
    token: string,
    query: Record<string, string | number | undefined> = {},
    expectedStatus = 200
  ): Promise<APIResponse> {
    return this.send("GET", "/api/tasks", { token, query, expectedStatus });
  }

  async updateTask(token: string, taskId: number, data: unknown, expectedStatus = 200): Promise<APIResponse> {
    return this.send("PATCH", `/api/tasks/${taskId}`, { token, data, expectedStatus });
  }

  async deleteTask(token: string, taskId: number, expectedStatus = 204): Promise<APIResponse> {
    return this.send("DELETE", `/api/tasks/${taskId}`, { token, expectedStatus });
  }

  async cleanupRun(token: string, runId: string, expectedStatus = 200): Promise<APIResponse> {
    return this.send("DELETE", `/api/tasks/testing/run/${runId}`, { token, expectedStatus });
  }
}
