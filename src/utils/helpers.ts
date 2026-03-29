import { Response } from "express";
import NodeCache from "node-cache";

// ─── Standard API Response ────────────────────────────────────
export interface ApiResponse<T = any> {
  status: number;
  message: string;
  message_ar: string;
  data: T;
  errors: any;
}

export function successResponse<T>(
  res: Response,
  data: T,
  messageEn = "Success",
  messageAr = "نجاح",
  statusCode = 200
): Response {
  return res.status(statusCode).json({
    status: statusCode,
    message: messageEn,
    message_ar: messageAr,
    data,
    errors: {},
  });
}

export function errorResponse(
  res: Response,
  errors: any,
  messageEn = "Bad Request",
  messageAr = "",
  statusCode = 400
): Response {
  return res.status(statusCode).json({
    status: statusCode,
    message: messageEn,
    message_ar: messageAr,
    data: [],
    errors: { errors: [errors] },
  });
}

// ─── In-Memory Cache (replaces Django cache) ──────────────────
export const appCache = new NodeCache({ stdTTL: 60, checkperiod: 30 });

export function cacheSet(key: string, value: any, ttlSeconds: number): void {
  appCache.set(key, value, ttlSeconds);
}

export function cacheGet<T>(key: string): T | undefined {
  return appCache.get<T>(key);
}

export function cacheDel(key: string): void {
  appCache.del(key);
}

// ─── Get Client IP ────────────────────────────────────────────
export function getClientIp(req: any): string {
  const forwarded = req.headers["x-forwarded-for"] as string;
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress || req.ip || "unknown";
}

// ─── Generate 4-digit OTP ─────────────────────────────────────
export function generateOtp(): string {
  return String(Math.floor(Math.random() * 10000)).padStart(4, "0");
}

// ─── Date Helpers ─────────────────────────────────────────────
export function isOlderThan19(birthdate: string): boolean {
  const birth = new Date(birthdate);
  const now = new Date();
  const age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    return age - 1 >= 19;
  }
  return age >= 19;
}

export function daysBetween(date1: Date, date2: Date): number {
  return Math.floor(
    (date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24)
  );
}
