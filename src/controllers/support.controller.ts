import type { Context } from "hono";
import { supportService } from "../services/support.service";
import { env } from "../config/env";

export const supportController = {
  async register(c: Context) {
    const secret = c.req.header("X-Support-Secret");
    if (!secret || secret !== env.SUPPORT_REGISTER_SECRET) {
      return c.json({ error: "Akses ditolak" }, 403);
    }

    try {
      const body = await c.req.json();
      const result = await supportService.register(body);
      return c.json(
        { message: "Akun support berhasil dibuat", data: result },
        201,
      );
    } catch (err: any) {
      return c.json({ error: err.message }, err.status ?? 500);
    }
  },

  async login(c: Context) {
    try {
      const { email, password } = await c.req.json();
      const result = await supportService.login(email, password);
      return c.json({ message: "Login berhasil", ...result });
    } catch (err: any) {
      return c.json({ error: err.message }, err.status ?? 500);
    }
  },

  async listWithdrawals(c: Context) {
    try {
      const status = c.req.query("status") as any;
      const tenantId = c.req.query("tenantId");
      const page = Number(c.req.query("page") ?? 1);
      const limit = Number(c.req.query("limit") ?? 20);

      const result = await supportService.listWithdrawals({
        status,
        tenantId,
        page,
        limit,
      });
      return c.json(result);
    } catch (err: any) {
      return c.json({ error: err.message }, err.status ?? 500);
    }
  },

  async getWithdrawal(c: Context) {
    try {
      const id = c.req.param("id")!;
      const result = await supportService.getWithdrawal(id);
      return c.json({ data: result });
    } catch (err: any) {
      return c.json({ error: err.message }, err.status ?? 500);
    }
  },

  async updateWithdrawalStatus(c: Context) {
    try {
      const id = c.req.param("id")!;
      const body = await c.req.json();
      const result = await supportService.updateWithdrawalStatus(id, body);
      return c.json({
        message: "Status withdrawal berhasil diperbarui",
        data: result,
      });
    } catch (err: any) {
      return c.json({ error: err.message }, err.status ?? 500);
    }
  },
};
