import type { Context, Next } from "hono";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface JwtPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
}

/**
 * Tenant-Aware Auth Middleware
 * Extracts JWT, validates it, and places tenant_id + user info in Hono context.
 */
export const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Token tidak ditemukan" }, 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const secret: string = env.JWT_SECRET;
    const decoded = jwt.verify(token!, secret) as unknown as JwtPayload;
    c.set("user", decoded);
    c.set("tenantId", decoded.tenantId);
    await next();
  } catch {
    return c.json({ error: "Token tidak valid atau kedaluwarsa" }, 401);
  }
};

/**
 * Helper to get current tenant ID from context
 */
export const getTenantId = (c: Context): string => {
  return c.get("tenantId");
};

/**
 * Helper to get current user from context
 */
export const getCurrentUser = (c: Context): JwtPayload => {
  return c.get("user");
};

/**
 * Generate JWT token
 */
export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "7d" });
};
