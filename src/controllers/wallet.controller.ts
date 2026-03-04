import type { Context } from "hono";
import { getTenantId } from "../middleware/auth";
import { walletService } from "../services/wallet.service";

export const walletController = {
  async getBalance(c: Context) {
    try {
      const data = await walletService.getBalanceAndMutations(getTenantId(c));
      return c.json({ data });
    } catch (error: any) {
      if (error.status) return c.json({ error: error.message }, error.status);
      throw error;
    }
  },

  async withdraw(c: Context) {
    const body = c.req.valid("json" as never) as { amount: number };

    try {
      const result = await walletService.withdraw(getTenantId(c), body.amount);
      return c.json(
        { message: "Permintaan penarikan berhasil dibuat", data: result },
        201,
      );
    } catch (error: any) {
      if (error.status) return c.json({ error: error.message }, error.status);
      console.error("Withdraw error:", error);
      return c.json(
        { error: "Gagal membuat penarikan: " + error.message },
        500,
      );
    }
  },

  async listWithdrawals(c: Context) {
    const data = await walletService.listWithdrawals(getTenantId(c));
    return c.json({ data });
  },
};
