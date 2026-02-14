import express from "express";
import path from "path";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

type AuthenticatedRequest = express.Request & { userId: number };

const app = express();
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const userId = req.header("x-user-id");
  if (!userId) return res.status(401).json({ error: "Missing x-user-id" });
  (req as AuthenticatedRequest).userId = Number(userId);
  next();
}

app.get("/health", async (_req, res) => {
  const r = await pool.query("SELECT 1 as ok");
  res.json({ ok: true, db: r.rows[0].ok === 1 });
});

// Auth simplificado (para automação)
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  const result = await pool.query("SELECT id, email FROM users WHERE email=$1 AND password=$2", [email, password]);
  if (result.rowCount === 0) return res.status(401).json({ error: "Invalid credentials" });
  res.json({ userId: result.rows[0].id, email: result.rows[0].email });
});

// Todos CRUD
app.get("/api/todos", requireAuth, async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId;
  const result = await pool.query("SELECT id, title, done FROM todos WHERE user_id=$1 ORDER BY id", [userId]);
  res.json(result.rows);
});

app.post("/api/todos", requireAuth, async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId;
  const { title } = req.body as { title: string };
  if (!title) return res.status(400).json({ error: "title required" });
  const result = await pool.query(
    "INSERT INTO todos (user_id, title, done) VALUES ($1,$2,false) RETURNING id, title, done",
    [userId, title]
  );
  res.status(201).json(result.rows[0]);
});

app.patch("/api/todos/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId;
  const todoId = Number(req.params.id);
  const { title, done } = req.body as { title?: string; done?: boolean };

  const result = await pool.query(
    `UPDATE todos
     SET title = COALESCE($1, title),
         done  = COALESCE($2, done)
     WHERE id=$3 AND user_id=$4
     RETURNING id, title, done`,
    [title ?? null, done ?? null, todoId, userId]
  );
  if (result.rowCount === 0) return res.status(404).json({ error: "Not found" });
  res.json(result.rows[0]);
});

app.delete("/api/todos/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId;
  const todoId = Number(req.params.id);
  const result = await pool.query("DELETE FROM todos WHERE id=$1 AND user_id=$2", [todoId, userId]);
  if (result.rowCount === 0) return res.status(404).json({ error: "Not found" });
  res.status(204).send();
});

// UI simples estática
app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "ui.html"));
});

app.get("/ui.html", (_req, res) => {
  res.sendFile(path.join(__dirname, "ui.html"));
});

export default app;
