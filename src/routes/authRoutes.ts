import express from "express";
import { log } from "../app/logger";
import { login } from "../services/authService";

const router = express.Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  const user = await login(email, password);
  log("info", "auth.login.success", { email: user.email, role: user.role });
  res.json(user);
});

export default router;
