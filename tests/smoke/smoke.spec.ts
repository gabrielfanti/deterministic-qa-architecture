import { expect, test } from "@playwright/test";
import { ApiClient } from "../../src/test-utils/apiClient";
import { buildTaskPayload } from "../../src/test-utils/dataFactory";
import { testId } from "../../src/test-utils/testRun";

test.describe("@api @smoke Core checks", () => {
  test("@api @smoke @db healthcheck reports db availability", async ({ request }) => {
    const response = await request.get("/health");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.db).toBe(true);
  });

  test("@api @smoke critical task happy path", async ({ request }) => {
    const api = new ApiClient(request);
    const userToken = (await api.login("qa-user@example.com", "password123")).token;
    const adminToken = (await api.login("qa-admin@example.com", "password123")).token;

    const runId = testId("smoke_happy");
    try {
      const created = await (await api.createTask(userToken, buildTaskPayload({ runId }), 201)).json();
      const listed = await (await api.listTasks(userToken, { q: created.title }, 200)).json();
      expect(listed.items.some((item: { id: number }) => item.id === created.id)).toBeTruthy();

      await api.deleteTask(userToken, created.id, 204);
      await api.getTask(userToken, created.id, 404);
    } finally {
      await api.cleanupRun(adminToken, runId);
    }
  });
});
