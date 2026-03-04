import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { orderController } from "../controllers/order.controller";

const orderRoutes = new Hono();

const createOrderSchema = z.object({
  customerId: z.string().min(1, "Customer ID wajib diisi"),
  eventDate: z.string().optional(),
  deliveryAddress: z.string().optional(),
  shippingFee: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  paymentType: z.enum(["full", "termin"]).default("full"),
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().min(1),
      }),
    )
    .min(1, "Minimal 1 item dalam pesanan"),
});

const updateOrderSchema = z.object({
  eventDate: z.string().optional(),
  deliveryAddress: z.string().optional(),
  shippingFee: z.number().min(0).optional(),
  tax: z.number().min(0).optional(),
  status: z
    .enum([
      "draft",
      "waiting_dp",
      "processing",
      "delivered",
      "waiting_payment",
      "completed",
      "cancelled",
    ])
    .optional(),
});

orderRoutes.get("/", orderController.list);
orderRoutes.get("/:id", orderController.getById);
orderRoutes.post(
  "/",
  zValidator("json", createOrderSchema),
  orderController.create,
);
orderRoutes.put(
  "/:id",
  zValidator("json", updateOrderSchema),
  orderController.update,
);
orderRoutes.delete("/:id", orderController.remove);

export default orderRoutes;
