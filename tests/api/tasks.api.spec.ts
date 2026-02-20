import { expect, test } from "@playwright/test";
import { ApiClient } from "../../src/test-utils/apiClient";
import { buildTaskPayload } from "../../src/test-utils/dataFactory";
import { assertSchema } from "../../src/test-utils/schemaValidator";
import { testId } from "../../src/test-utils/testRun";

test.describe("@api @regression Tasks API", () => {
  let api: ApiClient;
  let userToken: string;
  let adminToken: string;

  test.beforeEach(async ({ request }) => {
    api = new ApiClient(request);
    userToken = (await api.login("qa-user@example.com", "password123")).token;
    adminToken = (await api.login("qa-admin@example.com", "password123")).token;
  });

  async function cleanup(runId: string): Promise<void> {
    await api.cleanupRun(adminToken, runId);
  }

  test("@api @regression @contract create task returns schema", async () => {
    const runId = testId("api_create_schema");
    try {
      const payload = buildTaskPayload({ runId });
      const response = await api.createTask(userToken, payload, 201);
      const task = await response.json();
      assertSchema("task", task);
      expect(task.title).toBe(payload.title);
      expect(task.runId).toBe(runId);
    } finally {
      await cleanup(runId);
    }
  });

  test("@api @regression @negative create invalid task returns 422", async () => {
    const response = await api.createTask(userToken, { description: "invalid" }, 422);
    const body = await response.json();
    expect(body.error.code).toBe("validation_failed");
  });

  test("@api @regression get task by id", async () => {
    const runId = testId("api_get_by_id");
    try {
      const created = await (await api.createTask(userToken, buildTaskPayload({ runId }), 201)).json();
      const fetched = await (await api.getTask(userToken, created.id, 200)).json();
      expect(fetched.id).toBe(created.id);
      expect(fetched.externalRef).toBe(created.externalRef);
    } finally {
      await cleanup(runId);
    }
  });

  test("@api @regression @negative get missing task returns 404", async () => {
    await api.getTask(userToken, 9_999_999, 404);
  });

  test("@api @regression @pagination list uses default pagination", async () => {
    const list = await (await api.listTasks(userToken)).json();
    assertSchema("taskList", list);
    expect(list.page).toBe(1);
    expect(list.limit).toBe(10);
    expect(list.items.length).toBeLessThanOrEqual(10);
  });

  test("@api @regression @pagination list supports page boundaries", async () => {
    const runId = testId("api_pagination");
    try {
      await api.createTask(userToken, buildTaskPayload({ runId, title: `${runId} a` }), 201);
      await api.createTask(userToken, buildTaskPayload({ runId, title: `${runId} b` }), 201);
      await api.createTask(userToken, buildTaskPayload({ runId, title: `${runId} c` }), 201);

      const page1 = await (await api.listTasks(userToken, { q: runId, page: 1, limit: 2, sort: "asc" })).json();
      const page2 = await (await api.listTasks(userToken, { q: runId, page: 2, limit: 2, sort: "asc" })).json();

      expect(page1.items.length).toBe(2);
      expect(page2.items.length).toBe(1);
    } finally {
      await cleanup(runId);
    }
  });

  test("@api @regression @filtering list supports status/type filter", async () => {
    const runId = testId("api_filter");
    try {
      await api.createTask(userToken, buildTaskPayload({ runId, title: `${runId} done`, status: "done", type: "bug" }), 201);
      await api.createTask(userToken, buildTaskPayload({ runId, title: `${runId} todo`, status: "todo", type: "feature" }), 201);

      const filtered = await (await api.listTasks(userToken, { q: runId, status: "done", type: "bug", sort: "asc" })).json();
      expect(filtered.items.length).toBe(1);
      expect(filtered.items[0].status).toBe("done");
      expect(filtered.items[0].type).toBe("bug");
    } finally {
      await cleanup(runId);
    }
  });

  test("@api @regression @search list supports search", async () => {
    const runId = testId("api_search");
    try {
      await api.createTask(userToken, buildTaskPayload({ runId, title: `${runId} alpha` }), 201);
      await api.createTask(userToken, buildTaskPayload({ runId, title: `${runId} beta` }), 201);

      const searched = await (await api.listTasks(userToken, { q: `${runId} alpha` })).json();
      expect(searched.items).toHaveLength(1);
      expect(searched.items[0].title).toContain("alpha");
    } finally {
      await cleanup(runId);
    }
  });

  test("@api @regression @sorting list supports sort order", async () => {
    const runId = testId("api_sorting");
    try {
      const first = await (await api.createTask(userToken, buildTaskPayload({ runId, title: `${runId} 1` }), 201)).json();
      const second = await (await api.createTask(userToken, buildTaskPayload({ runId, title: `${runId} 2` }), 201)).json();

      const asc = await (await api.listTasks(userToken, { q: runId, sort: "asc", limit: 10 })).json();
      const desc = await (await api.listTasks(userToken, { q: runId, sort: "desc", limit: 10 })).json();

      expect(asc.items[0].id).toBe(first.id);
      expect(desc.items[0].id).toBe(second.id);
    } finally {
      await cleanup(runId);
    }
  });

  test("@api @regression update task increments version", async () => {
    const runId = testId("api_update_success");
    try {
      const created = await (await api.createTask(userToken, buildTaskPayload({ runId }), 201)).json();
      const updated = await (
        await api.updateTask(userToken, created.id, { title: `${created.title} updated`, status: "done", version: created.version }, 200)
      ).json();

      expect(updated.title).toContain("updated");
      expect(updated.status).toBe("done");
      expect(updated.version).toBe(created.version + 1);
    } finally {
      await cleanup(runId);
    }
  });

  test("@api @regression @negative update with stale version returns 409", async () => {
    const runId = testId("api_update_conflict");
    try {
      const created = await (await api.createTask(userToken, buildTaskPayload({ runId }), 201)).json();
      await api.updateTask(userToken, created.id, { title: "stale", version: created.version + 10 }, 409);
    } finally {
      await cleanup(runId);
    }
  });

  test("@api @regression delete task then get returns 404", async () => {
    const runId = testId("api_delete");
    try {
      const created = await (await api.createTask(userToken, buildTaskPayload({ runId }), 201)).json();
      await api.deleteTask(userToken, created.id, 204);
      await api.getTask(userToken, created.id, 404);
    } finally {
      await cleanup(runId);
    }
  });
});
