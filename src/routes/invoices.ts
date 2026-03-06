import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { invoiceController } from "../controllers/invoice.controller";

const invoiceRoutes = new Hono();

const generateInvoiceSchema = z.object({
  type: z.enum(["dp", "pelunasan", "full"]).default("full"),
  redirectUrl: z.string().url().optional(),
});

invoiceRoutes.get("/", invoiceController.list);
invoiceRoutes.get("/:id", invoiceController.getById);
invoiceRoutes.post(
  "/order/:orderId/generate",
  zValidator("json", generateInvoiceSchema),
  invoiceController.generate,
);

export default invoiceRoutes;
