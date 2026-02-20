import { expect, test } from "@playwright/test";
import { ApiClient } from "../../src/test-utils/apiClient";
import { testId } from "../../src/test-utils/testRun";

test.describe("@e2e @regression Tasks UI", () => {
  let adminToken: string;

  test.beforeEach(async ({ request }) => {
    const api = new ApiClient(request);
    adminToken = (await api.login("qa-admin@example.com", "password123")).token;
  });

  async function loginAsUser(page: import("@playwright/test").Page): Promise<void> {
    await page.goto("/");
    await page.getByRole("button", { name: "Login", exact: true }).click();
    await expect(page.locator("#authUser")).toHaveText("qa-user@example.com");
  }

  async function cleanupRun(request: import("@playwright/test").APIRequestContext, runId: string): Promise<void> {
    const api = new ApiClient(request);
    await api.cleanupRun(adminToken, runId);
  }

  test("@e2e @regression @smoke create task via UI and verify persistence", async ({ page, request }) => {
    const runId = testId("e2e_create");
    try {
      await loginAsUser(page);
      const title = `UI create ${runId}`;
      await page.locator("#runId").fill(runId);
      await page.locator("#title").fill(title);
      await page.getByRole("button", { name: "Create" }).click();
      await expect(page.locator("#formError")).toHaveText("");

      const api = new ApiClient(request);
      const userToken = (await api.login("qa-user@example.com", "password123")).token;
      const listed = await (await api.listTasks(userToken, { q: title }, 200)).json();
      expect(listed.items.some((item: { title: string }) => item.title === title)).toBeTruthy();

    } finally {
      await cleanupRun(request, runId);
    }
  });

  test("@e2e @regression edit task via UI", async ({ page, request }) => {
    const runId = testId("e2e_edit");
    try {
      await loginAsUser(page);
      const beforeTitle = `before edit ${runId}`;
      const afterTitle = `after edit ${runId}`;

      await page.locator("#runId").fill(runId);
      await page.locator("#title").fill(beforeTitle);
      await page.getByRole("button", { name: "Create" }).click();

      await page.locator("#searchQ").fill(beforeTitle);
      await page.getByRole("button", { name: "Apply" }).click();
      await expect(page.locator("#taskTableBody tr")).toHaveCount(1);

      const row = page.locator("#taskTableBody tr").first();
      await row.locator("input[aria-label^='edit-title-']").fill(afterTitle);
      await row.getByRole("button", { name: "Save" }).click();

      await expect(page.locator("#taskTableBody tr")).toHaveCount(0);
      await page.locator("#searchQ").fill(afterTitle);
      await page.getByRole("button", { name: "Apply" }).click();
      await expect(page.locator("#taskTableBody tr").first().locator("input[aria-label^='edit-title-']")).toHaveValue(afterTitle);
    } finally {
      await cleanupRun(request, runId);
    }
  });

  test("@e2e @regression delete task via UI", async ({ page, request }) => {
    const runId = testId("e2e_delete");
    try {
      await loginAsUser(page);
      const title = `delete me ${runId}`;
      await page.locator("#runId").fill(runId);
      await page.locator("#title").fill(title);
      await page.getByRole("button", { name: "Create" }).click();

      await page.locator("#searchQ").fill(title);
      await page.getByRole("button", { name: "Apply" }).click();
      await page.locator("#taskTableBody tr").first().getByRole("button", { name: "Delete" }).click();

      await page.locator("#searchQ").fill(title);
      await page.getByRole("button", { name: "Apply" }).click();
      await expect(page.locator("#taskTableBody tr")).toHaveCount(0);
    } finally {
      await cleanupRun(request, runId);
    }
  });

  test("@e2e @regression @auth @negative auth flow shows failures and role changes", async ({ page }) => {
    await page.goto("/");
    await page.locator("#password").fill("wrong-password");
    await page.getByRole("button", { name: "Login", exact: true }).click();
    await expect(page.locator("#authError")).toContainText("invalid_credentials");

    await page.locator("#password").fill("password123");
    await page.getByRole("button", { name: "Login", exact: true }).click();
    await expect(page.locator("#authRole")).toHaveText("user");

    await page.getByRole("button", { name: "Login as admin" }).click();
    await expect(page.locator("#authRole")).toHaveText("admin");
  });
});
