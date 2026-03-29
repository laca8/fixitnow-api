import "reflect-metadata";
import "express-async-errors";
import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";

import { AppDataSource } from "./config/database";
import loansRoutes from "./routes/loansRoutes";

const app = express();
const PORT = parseInt(process.env.PORT || "3000");

// ── Security & parsing middleware ─────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── Rate limiting ─────────────────────────────────────────────
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: { status: 429, message: "Too many requests, please try again later." },
  })
);

// ── Static files (uploaded docs) ──────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// ── Routes ────────────────────────────────────────────────────
app.use("/api/loans", loansRoutes);

// ── Health check ──────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// ── Global error handler ──────────────────────────────────────
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[ERROR]", err?.message || err);
  res.status(500).json({
    status: 500,
    message: "Internal server error",
    message_ar: "خطأ في الخادم",
    data: [],
    errors: { errors: [err?.message || "Unknown error"] },
  });
});

// ── Boot ──────────────────────────────────────────────────────
AppDataSource.initialize()
  .then(() => {
    console.log("✅  MySQL connected via TypeORM");
    app.listen(PORT, () => {
      console.log(`🚀  Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌  Database connection failed:", err);
    process.exit(1);
  });

export default app;
