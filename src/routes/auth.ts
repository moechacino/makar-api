import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { authController } from "../controllers/auth.controller";

const auth = new Hono();

const registerSchema = z.object({
  tenantName: z.string().min(3, "Nama katering minimal 3 karakter"),
  slug: z
    .string()
    .min(3)
    .regex(/^[a-z0-9-]+$/, "Slug hanya boleh huruf kecil, angka, dan strip"),
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

auth.post(
  "/register-tenant",
  zValidator("json", registerSchema),
  authController.registerTenant,
);
auth.post("/login", zValidator("json", loginSchema), authController.login);

export default auth;
