import { test, expect } from "@playwright/test";

test.describe("@smoke @regression E2E /todos", () => {
  test("E2E: login, add todo, toggle done", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Login" }).click();
    await expect(page.locator("#userId")).not.toHaveText("-");

    const title = `Todo E2E ${Date.now()}`;
    await page.locator("#newTodo").fill(title);
    await page.getByRole("button", { name: "Adicionar" }).click();

    const item = page.locator("#list li").filter({ hasText: title });
    await expect(item).toBeVisible();

    await item.click();
    await expect(item).toHaveClass(/done/);
  });
});
