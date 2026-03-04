import type { Context } from "hono";
import { getTenantId } from "../middleware/auth";
import { orderService } from "../services/order.service";

export const orderController = {
  async list(c: Context) {
    const data = await orderService.list(getTenantId(c));
    return c.json({ data });
  },

  async getById(c: Context) {
    try {
      const data = await orderService.getById(
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
      const result = await orderService.create(getTenantId(c), body);
      return c.json({ message: "Pesanan berhasil dibuat", data: result }, 201);
    } catch (error: any) {
      if (error.status) return c.json({ error: error.message }, error.status);
      console.error("Create order error:", error);
      return c.json({ error: "Gagal membuat pesanan: " + error.message }, 500);
    }
  },

  async update(c: Context) {
    const body = c.req.valid("json" as never);

    try {
      await orderService.update(getTenantId(c), c.req.param("id"), body);
      return c.json({ message: "Pesanan berhasil diperbarui" });
    } catch (error: any) {
      if (error.status) return c.json({ error: error.message }, error.status);
      console.error("Update order error:", error);
      return c.json(
        { error: "Gagal memperbarui pesanan: " + error.message },
        500,
      );
    }
  },

  async remove(c: Context) {
    try {
      await orderService.remove(getTenantId(c), c.req.param("id"));
      return c.json({ message: "Pesanan berhasil dihapus" });
    } catch (error: any) {
      if (error.status) return c.json({ error: error.message }, error.status);
      console.error("Delete order error:", error);
      return c.json(
        { error: "Gagal menghapus pesanan: " + error.message },
        500,
      );
    }
  },
};
