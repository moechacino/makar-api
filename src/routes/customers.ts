import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { customerController } from "../controllers/customer.controller";

const customerRoutes = new Hono();

const createCustomerSchema = z.object({
  name: z.string().min(1, "Nama pelanggan wajib diisi"),
  phone: z.string().optional(),
  email: z.email().optional(),
  defaultAddress: z.string().optional(),
});

const updateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  email: z.email().optional(),
  defaultAddress: z.string().optional(),
});

customerRoutes.get("/", customerController.list);
customerRoutes.get("/:id", customerController.getById);
customerRoutes.post(
  "/",
  zValidator("json", createCustomerSchema),
  customerController.create,
);
customerRoutes.put(
  "/:id",
  zValidator("json", updateCustomerSchema),
  customerController.update,
);
customerRoutes.delete("/:id", customerController.remove);

export default customerRoutes;
