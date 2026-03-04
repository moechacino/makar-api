import type { Context } from "hono";
import { getTenantId } from "../middleware/auth";
import { productService } from "../services/product.service";

export const productController = {
  async list(c: Context) {
    const data = await productService.list(getTenantId(c));
    return c.json({ data });
  },

  async getById(c: Context) {
    try {
      const data = await productService.getById(
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
      const result = await productService.create(getTenantId(c), body);
      return c.json({ message: "Produk berhasil dibuat", data: result }, 201);
    } catch (error: any) {
      if (error.status) return c.json({ error: error.message }, error.status);
      console.error("Create product error:", error);
      return c.json({ error: "Gagal membuat produk: " + error.message }, 500);
    }
  },

  async update(c: Context) {
    const body = c.req.valid("json" as never);

    try {
      await productService.update(getTenantId(c), c.req.param("id"), body);
      return c.json({ message: "Produk berhasil diperbarui" });
    } catch (error: any) {
      if (error.status) return c.json({ error: error.message }, error.status);
      console.error("Update product error:", error);
      return c.json(
        { error: "Gagal memperbarui produk: " + error.message },
        500,
      );
    }
  },

  async remove(c: Context) {
    try {
      await productService.remove(getTenantId(c), c.req.param("id"));
      return c.json({ message: "Produk berhasil dihapus" });
    } catch (error: any) {
      if (error.status) return c.json({ error: error.message }, error.status);
      console.error("Delete product error:", error);
      return c.json({ error: "Gagal menghapus produk: " + error.message }, 500);
    }
  },
};
