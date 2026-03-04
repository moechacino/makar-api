import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { productController } from "../controllers/product.controller";

const productRoutes = new Hono();

const createProductSchema = z.object({
  name: z.string().min(1, "Nama produk wajib diisi"),
  description: z.string().optional(),
  category: z.string().optional(),
  type: z.enum(["satuan", "paket"]).default("satuan"),
  cogsPrice: z.number().min(0).default(0),
  sellPrice: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
  bundleItems: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().min(1).default(1),
      }),
    )
    .optional(),
});

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  cogsPrice: z.number().min(0).optional(),
  sellPrice: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
  bundleItems: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().min(1).default(1),
      }),
    )
    .optional(),
});

productRoutes.get("/", productController.list);
productRoutes.get("/:id", productController.getById);
productRoutes.post(
  "/",
  zValidator("json", createProductSchema),
  productController.create,
);
productRoutes.put(
  "/:id",
  zValidator("json", updateProductSchema),
  productController.update,
);
productRoutes.delete("/:id", productController.remove);

export default productRoutes;
