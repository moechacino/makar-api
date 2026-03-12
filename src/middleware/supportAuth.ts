import type { Context, Next } from "hono";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface SupportJwtPayload {
  supportUserId: string;
  email: string;
  role: "support";
}

export const supportAuthMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Token tidak ditemukan" }, 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token!,
      env.SUPPORT_JWT_SECRET,
    ) as unknown as SupportJwtPayload;

    if (decoded.role !== "support") {
      return c.json({ error: "Akses ditolak" }, 403);
    }

    c.set("supportUser", decoded);
    await next();
  } catch {
    return c.json({ error: "Token tidak valid atau kedaluwarsa" }, 401);
  }
};

export const generateSupportToken = (payload: SupportJwtPayload): string => {
  return jwt.sign(payload, env.SUPPORT_JWT_SECRET, { expiresIn: "7d" });
};
