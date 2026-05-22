import cors from "cors";
import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { createCheckout, createSession, getSession, handleCommand } from "./agent/orderAgent.js";
import { signin, signup } from "./auth/userStore.js";

const app = express();
const port = Number(process.env.PORT ?? 8080);
const frontendOrigin = process.env.FRONTEND_ORIGIN ?? "http://localhost:5173";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDist = path.resolve(__dirname, "../../frontend/dist");

app.use(cors({ origin: frontendOrigin === "*" ? true : frontendOrigin }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, mode: process.env.PROVIDER_MODE ?? "mock" });
});

app.post("/api/session", (req, res) => {
  const body = z
    .object({
      location: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      userId: z.string().optional()
    })
    .parse(req.body ?? {});
  res.json({ session: createSession(body.location, body.latitude, body.longitude, body.userId) });
});

app.post("/api/auth/signup", (req, res, next) => {
  try {
    const body = z
      .object({
        name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(6)
      })
      .parse(req.body);
    res.json({ user: signup(body.name, body.email, body.password) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/signin", (req, res, next) => {
  try {
    const body = z
      .object({
        email: z.string().email(),
        password: z.string().min(1)
      })
      .parse(req.body);
    res.json({ user: signin(body.email, body.password) });
  } catch (error) {
    next(error);
  }
});

app.get("/api/session/:id", (req, res) => {
  const session = getSession(req.params.id);
  if (!session) return res.status(404).json({ error: "Session not found" });
  return res.json({ session });
});

app.post("/api/agent/command", async (req, res, next) => {
  try {
    const body = z
      .object({
        sessionId: z.string().optional(),
        command: z.string().min(1),
        location: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        userId: z.string().optional()
      })
      .parse(req.body);

    res.json(await handleCommand(body.sessionId, body.command, body.location, body.latitude, body.longitude, body.userId));
  } catch (error) {
    next(error);
  }
});

app.post("/api/checkout", (req, res, next) => {
  try {
    const body = z.object({ sessionId: z.string().min(1) }).parse(req.body);
    res.json({ order: createCheckout(body.sessionId) });
  } catch (error) {
    next(error);
  }
});

app.use(express.static(frontendDist));

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(frontendDist, "index.html"), (error) => {
    if (error) next();
  });
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = error instanceof Error ? error.message : "Unexpected error";
  res.status(400).json({ error: message });
});

app.listen(port, () => {
  console.log(`Food ordering agent API listening on ${port}`);
});
