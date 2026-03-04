import type { Context } from "hono";
import { getTenantId } from "../middleware/auth";
import { invoiceService } from "../services/invoice.service";

export const invoiceController = {
  async list(c: Context) {
    const data = await invoiceService.list(getTenantId(c));
    return c.json({ data });
  },

  async getById(c: Context) {
    try {
      const data = await invoiceService.getById(
        getTenantId(c),
        c.req.param("id"),
      );
      return c.json({ data });
    } catch (error: any) {
      if (error.status) return c.json({ error: error.message }, error.status);
      throw error;
    }
  },

  async generate(c: Context) {
    const body = c.req.valid("json" as never);

    try {
      const result = await invoiceService.generateForOrder(
        getTenantId(c),
        c.req.param("orderId"),
        body,
      );
      return c.json({ message: "Invoice berhasil dibuat", data: result }, 201);
    } catch (error: any) {
      if (error.status) return c.json({ error: error.message }, error.status);
      console.error("Generate invoice error:", error);
      return c.json({ error: "Gagal membuat invoice: " + error.message }, 500);
    }
  },
};
