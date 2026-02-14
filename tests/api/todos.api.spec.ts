import { test, expect } from "@playwright/test";

test.describe("@regression API /todos", () => {
  test("@smoke login + list + create + update + delete", async ({ request }) => {
    const login = await request.post("/auth/login", {
      data: { email: "qa@example.com", password: "password123" },
    });
    expect(login.ok()).toBeTruthy();
    const { userId } = await login.json();

    const headers = { "x-user-id": String(userId) };

    const list1 = await request.get("/api/todos", { headers });
    expect(list1.ok()).toBeTruthy();
    const todos1 = await list1.json();
    expect(Array.isArray(todos1)).toBeTruthy();

    const created = await request.post("/api/todos", {
      headers,
      data: { title: "Criada via API" },
    });
    expect(created.status()).toBe(201);
    const createdBody = await created.json();
    expect(createdBody.title).toBe("Criada via API");
    expect(createdBody.done).toBe(false);

    const updated = await request.patch(`/api/todos/${createdBody.id}`, {
      headers,
      data: { done: true },
    });
    expect(updated.ok()).toBeTruthy();
    const updatedBody = await updated.json();
    expect(updatedBody.done).toBe(true);

    const del = await request.delete(`/api/todos/${createdBody.id}`, { headers });
    expect(del.status()).toBe(204);
  });

  test("unauthorized without header", async ({ request }) => {
    const r = await request.get("/api/todos");
    expect(r.status()).toBe(401);
  });
});
