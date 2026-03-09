import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { settingsController } from "../controllers/settings.controller";

const settingsRoutes = new Hono();

const updateTenantSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").optional(),
  slug: z
    .string()
    .min(3)
    .regex(/^[a-z0-9-]+$/, "Slug hanya boleh huruf kecil, angka, dan strip")
    .optional(),
  bankCode: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankAccountName: z.string().optional(),
});

const updateProfileSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").optional(),
  email: z.email("Format email tidak valid").optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Password saat ini wajib diisi"),
  newPassword: z.string().min(6, "Password baru minimal 6 karakter"),
});

// ─── Tenant Settings ──────────────────────────────────────────────────────────
settingsRoutes.get("/tenant", settingsController.getTenant);
settingsRoutes.put(
  "/tenant",
  zValidator("json", updateTenantSchema),
  settingsController.updateTenant,
);
settingsRoutes.post("/tenant/logo", settingsController.uploadLogo);

// ─── User Profile ─────────────────────────────────────────────────────────────
settingsRoutes.get("/profile", settingsController.getProfile);
settingsRoutes.put(
  "/profile",
  zValidator("json", updateProfileSchema),
  settingsController.updateProfile,
);
settingsRoutes.put(
  "/profile/password",
  zValidator("json", changePasswordSchema),
  settingsController.changePassword,
);

export default settingsRoutes;
