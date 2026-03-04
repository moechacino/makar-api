import type { Context } from "hono";
import { getTenantId } from "../middleware/auth";
import { customerService } from "../services/customer.service";

export const customerController = {
  async list(c: Context) {
    const data = await customerService.list(getTenantId(c));
    return c.json({ data });
  },

  async getById(c: Context) {
    try {
      const data = await customerService.getById(
        getTenantId(c),
        c.req.param("id"),
      );
      return c.json({ data });
    } catch (error: any) {
      if (error.status) return c.json({ error: error.message }, error.status);
      throw error;
    }
  },

  async create(c: Context) {
    const body = c.req.valid("json" as never);

    try {
      const result = await customerService.create(getTenantId(c), body);
      return c.json(
        { message: "Pelanggan berhasil dibuat", data: result },
        201,
      );
    } catch (error: any) {
      if (error.status) return c.json({ error: error.message }, error.status);
      console.error("Create customer error:", error);
      return c.json(
        { error: "Gagal membuat pelanggan: " + error.message },
        500,
      );
    }
  },

  async update(c: Context) {
    const body = c.req.valid("json" as never);

    try {
      await customerService.update(getTenantId(c), c.req.param("id"), body);
      return c.json({ message: "Pelanggan berhasil diperbarui" });
    } catch (error: any) {
      if (error.status) return c.json({ error: error.message }, error.status);
      console.error("Update customer error:", error);
      return c.json(
        { error: "Gagal memperbarui pelanggan: " + error.message },
        500,
      );
    }
  },

  async remove(c: Context) {
    try {
      await customerService.remove(getTenantId(c), c.req.param("id"));
      return c.json({ message: "Pelanggan berhasil dihapus" });
    } catch (error: any) {
      if (error.status) return c.json({ error: error.message }, error.status);
      console.error("Delete customer error:", error);
      return c.json(
        { error: "Gagal menghapus pelanggan: " + error.message },
        500,
      );
    }
  },
};
