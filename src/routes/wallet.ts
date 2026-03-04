import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { walletController } from "../controllers/wallet.controller";

const walletRoutes = new Hono();

const withdrawSchema = z.object({
  amount: z.number().min(10000, "Minimum penarikan Rp 10.000"),
});

walletRoutes.get("/", walletController.getBalance);
walletRoutes.post(
  "/withdraw",
  zValidator("json", withdrawSchema),
  walletController.withdraw,
);
walletRoutes.get("/withdrawals", walletController.listWithdrawals);

export default walletRoutes;
