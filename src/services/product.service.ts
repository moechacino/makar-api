import { db } from "../db";
import { products, bundleItems, orderItems } from "../db/schema";
import { eq, and, count } from "drizzle-orm";

interface CreateProductInput {
  name: string;
  description?: string;
  category?: string;
  type: "satuan" | "paket";
  cogsPrice: number;
  sellPrice: number;
  isActive: boolean;
  bundleItems?: { productId: string; quantity: number }[];
}

interface UpdateProductInput {
  name?: string;
  description?: string;
  category?: string;
  cogsPrice?: number;
  sellPrice?: number;
  isActive?: boolean;
  bundleItems?: { productId: string; quantity: number }[];
}

export const productService = {
  async list(tenantId: string) {
    const allProducts = await db
      .select()
      .from(products)
      .where(eq(products.tenantId, tenantId));

    const paketIds = allProducts
      .filter((p) => p.type === "paket")
      .map((p) => p.id);

    let bundleMap = new Map<string, any[]>();
    if (paketIds.length > 0) {
      const allBundleItems = await db
        .select({
          packageId: bundleItems.packageId,
          id: bundleItems.id,
          productId: bundleItems.productId,
          quantity: bundleItems.quantity,
          productName: products.name,
          productSellPrice: products.sellPrice,
        })
        .from(bundleItems)
        .innerJoin(products, eq(bundleItems.productId, products.id));

      for (const item of allBundleItems) {
        const existing = bundleMap.get(item.packageId) ?? [];
        existing.push({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          productName: item.productName,
          productSellPrice: item.productSellPrice,
        });
        bundleMap.set(item.packageId, existing);
      }
    }

    return allProducts.map((p) => ({
      ...p,
      bundleItems: bundleMap.get(p.id) ?? [],
    }));
  },

  async getById(tenantId: string, productId: string) {
    const result = await db
      .select()
      .from(products)
      .where(and(eq(products.id, productId), eq(products.tenantId, tenantId)))
      .limit(1);

    if (result.length === 0) {
      throw { status: 404, message: "Produk tidak ditemukan" };
    }

    const product = result[0]!;

    let items: any[] = [];
    if (product.type === "paket") {
      items = await db
        .select({
          id: bundleItems.id,
          productId: bundleItems.productId,
          quantity: bundleItems.quantity,
          productName: products.name,
          productSellPrice: products.sellPrice,
        })
        .from(bundleItems)
        .innerJoin(products, eq(bundleItems.productId, products.id))
        .where(eq(bundleItems.packageId, productId));
    }

    return { ...product, bundleItems: items };
  },

  async create(tenantId: string, input: CreateProductInput) {
    const productId = crypto.randomUUID();

    await db.insert(products).values({
      id: productId,
      tenantId,
      name: input.name,
      description: input.description ?? null,
      category: input.category ?? null,
      type: input.type,
      cogsPrice: input.cogsPrice,
      sellPrice: input.sellPrice,
      isActive: input.isActive,
    });

    if (input.type === "paket" && input.bundleItems?.length) {
      const bundleValues = input.bundleItems.map((item) => ({
        packageId: productId,
        productId: item.productId,
        quantity: item.quantity,
      }));
      await db.insert(bundleItems).values(bundleValues);
    }

    return { id: productId };
  },

  async update(tenantId: string, productId: string, input: UpdateProductInput) {
    const existing = await db
      .select()
      .from(products)
      .where(and(eq(products.id, productId), eq(products.tenantId, tenantId)))
      .limit(1);

    if (existing.length === 0) {
      throw { status: 404, message: "Produk tidak ditemukan" };
    }

    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined)
      updateData.description = input.description;
    if (input.category !== undefined) updateData.category = input.category;
    if (input.cogsPrice !== undefined) updateData.cogsPrice = input.cogsPrice;
    if (input.sellPrice !== undefined) updateData.sellPrice = input.sellPrice;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;

    await db
      .update(products)
      .set(updateData)
      .where(and(eq(products.id, productId), eq(products.tenantId, tenantId)));

    if (input.bundleItems && existing[0]!.type === "paket") {
      await db.delete(bundleItems).where(eq(bundleItems.packageId, productId));

      if (input.bundleItems.length > 0) {
        const bundleValues = input.bundleItems.map((item) => ({
          packageId: productId,
          productId: item.productId,
          quantity: item.quantity,
        }));
        await db.insert(bundleItems).values(bundleValues);
      }
    }
  },

  async remove(tenantId: string, productId: string) {
    const existing = await db
      .select()
      .from(products)
      .where(and(eq(products.id, productId), eq(products.tenantId, tenantId)))
      .limit(1);

    if (existing.length === 0) {
      throw { status: 404, message: "Produk tidak ditemukan" };
    }

    // Check if product is used in any order
    const usedInOrders = await db
      .select({ total: count() })
      .from(orderItems)
      .where(eq(orderItems.productId, productId));

    if (usedInOrders[0]!.total > 0) {
      throw {
        status: 400,
        message:
          "Produk tidak bisa dihapus karena sudah digunakan dalam pesanan. Nonaktifkan produk sebagai gantinya.",
      };
    }

    // Check if product is used as a child item in any bundle
    const usedInBundles = await db
      .select({
        packageId: bundleItems.packageId,
        packageName: products.name,
      })
      .from(bundleItems)
      .innerJoin(products, eq(bundleItems.packageId, products.id))
      .where(eq(bundleItems.productId, productId));

    if (usedInBundles.length > 0) {
      const packageNames = usedInBundles.map((b) => b.packageName).join(", ");
      throw {
        status: 400,
        message: `Produk tidak bisa dihapus karena masih digunakan dalam paket: ${packageNames}. Hapus produk dari paket tersebut terlebih dahulu.`,
      };
    }

    // Delete bundle_items where this product is the package
    if (existing[0]!.type === "paket") {
      await db.delete(bundleItems).where(eq(bundleItems.packageId, productId));
    }

    await db
      .delete(products)
      .where(and(eq(products.id, productId), eq(products.tenantId, tenantId)));
  },
};
