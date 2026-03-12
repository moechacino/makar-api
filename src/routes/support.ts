import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { supportController } from "../controllers/support.controller";
import { supportAuthMiddleware } from "../middleware/supportAuth";

const supportRoutes = new Hono();

// ─── Auth ─────────────────────────────────────────────────────────────────────
// supportRoutes.post("/auth/register", supportController.register);

supportRoutes.post(
  "/auth/login",
  zValidator(
    "json",
    z.object({
      email: z.email("Email tidak valid"),
      password: z.string().min(1, "Password wajib diisi"),
    }),
  ),
  supportController.login,
);

// ─── Withdrawal Management (requires support JWT) ─────────────────────────────
supportRoutes.use("/withdrawals/*", supportAuthMiddleware);
supportRoutes.use("/withdrawals", supportAuthMiddleware);

supportRoutes.get("/withdrawals", supportController.listWithdrawals);
supportRoutes.get("/withdrawals/:id", supportController.getWithdrawal);

supportRoutes.patch(
  "/withdrawals/:id/status",
  zValidator(
    "json",
    z.object({
      status: z.enum(["processing", "completed", "failed"]),
      disbursementId: z.string().optional(),
    }),
  ),
  supportController.updateWithdrawalStatus,
);

export default supportRoutes;
