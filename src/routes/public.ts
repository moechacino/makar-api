import { Hono } from "hono";
import { orderService } from "../services/order.service";

const publicRoutes = new Hono();

publicRoutes.get("/orders/:orderId", async (c) => {
  try {
    const data = await orderService.getPublicDetail(c.req.param("orderId"));
    return c.json({ data });
  } catch (error: any) {
    if (error.status) return c.json({ error: error.message }, error.status);
    console.error("Public order detail error:", error);
    return c.json({ error: "Gagal mengambil detail pesanan" }, 500);
  }
});

export default publicRoutes;
