import "dotenv/config";
import express from "express";
import cors from "cors";
import { createPendingCode, getRecord, markApproved } from "./authStore.js";
import { createToken, verifyToken } from "./jwt.js";
import { validateSupabaseAccessToken } from "./supabaseAdmin.js";

const app = express();
const port = Number(process.env.PORT || 4000);
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(cors({ origin: frontendUrl }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/auth/start", (req, res) => {
  const provider = String(req.body?.provider || "").trim();
  const record = createPendingCode();
  
  let verificationUrl = `${frontendUrl}/verify?code=${record.code}`;
  if (provider) {
    verificationUrl += `&provider=${encodeURIComponent(provider)}`;
  }
  
  res.json({
    user_code: record.code,
    verification_url: verificationUrl,
  });
});

app.post("/auth/verify", (req, res) => {
  const code = String(req.body?.code || "").trim();
  if (!code) {
    return res.status(400).json({ error: "Code is required" });
  }

  const record = getRecord(code);
  if (!record) {
    return res.status(404).json({ error: "Invalid code" });
  }

  if (record.status !== "pending") {
    return res.status(409).json({ error: "Code is already used" });
  }

  return res.json({ ok: true });
});

app.post("/auth/complete", async (req, res) => {
  const code = String(req.body?.code || "").trim();
  const authHeader = String(req.headers.authorization || "");
  const supabaseAccessToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!code) {
    return res.status(400).json({ error: "Code is required" });
  }

  if (!supabaseAccessToken) {
    return res.status(401).json({ error: "Supabase access token is required" });
  }

  const existing = getRecord(code);
  if (!existing) {
    return res.status(404).json({ error: "Invalid code" });
  }

  if (existing.status !== "pending") {
    return res.status(409).json({ error: "Code is already used" });
  }

  const supabaseUser = await validateSupabaseAccessToken(supabaseAccessToken);
  if (!supabaseUser) {
    return res.status(401).json({ error: "Invalid Supabase session token" });
  }

  const token = createToken({ email: supabaseUser.email, name: supabaseUser.name });
  const updated = markApproved(code, { email: supabaseUser.email, name: supabaseUser.name }, token);

  if (!updated) {
    return res.status(404).json({ error: "Invalid code" });
  }

  return res.json({ status: "approved" });
});

app.post("/auth/check", (req, res) => {
  const code = String(req.body?.code || "").trim();
  if (!code) {
    return res.status(400).json({ error: "Code is required" });
  }

  const record = getRecord(code);
  if (!record) {
    return res.status(404).json({ error: "Invalid code" });
  }

  if (record.status === "pending") {
    return res.json({ status: "pending" });
  }

  return res.json({
    status: "approved",
    token: record.token,
    user: record.user,
  });
});

app.post("/auth/me", (req, res) => {
  const authHeader = String(req.headers.authorization || "");
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const user = token ? verifyToken(token) : null;
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  return res.json({ user });
});

app.post("/cli/execute", (req, res) => {
  const authHeader = String(req.headers.authorization || "");
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const user = token ? verifyToken(token) : null;
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const task = String(req.body?.task || "").trim();
  if (!task) {
    return res.status(400).json({ error: "Task is required" });
  }

  return res.json({
    ok: true,
    user,
    task,
    message: `Task accepted: ${task}`,
  });
});

const server = app.listen(port, () => {
  console.log(`Auth backend running at http://localhost:${port}`);
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\n❌ Port ${port} is already in use.`);
    console.error(`   Another instance of the backend may still be running.`);
    console.error(`   Fix: Run this command to free the port:\n`);
    console.error(`   PowerShell:  Get-NetTCPConnection -LocalPort ${port} | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }`);
    console.error(`   Then retry:  npm run backend:dev\n`);
  } else {
    console.error("Server error:", err);
  }
  process.exit(1);
});
