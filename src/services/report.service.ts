import { db } from "../db";
import { orderItems, orders, products, bundleItems } from "../db/schema";
import { eq, and, sql, gte, lte } from "drizzle-orm";

export const reportService = {
  async getKitchenRecap(tenantId: string, startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate + "T23:59:59");

    // Get all order items within date range
    const orderItemsResult = await db
      .select({
        orderItemId: orderItems.id,
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        productName: products.name,
        productType: products.type,
        orderEventDate: orders.eventDate,
        orderStatus: orders.status,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(
        and(
          eq(orders.tenantId, tenantId),
          gte(orders.eventDate, start),
          lte(orders.eventDate, end),
          sql`${orders.status} IN ('processing')`,
        ),
      );

    // Break down bundles into unit products
    const productionMap = new Map<
      string,
      { name: string; totalQuantity: number }
    >();

    for (const item of orderItemsResult) {
      if (item.productType === "satuan") {
        const existing = productionMap.get(item.productId);
        if (existing) {
          existing.totalQuantity += item.quantity;
        } else {
          productionMap.set(item.productId, {
            name: item.productName,
            totalQuantity: item.quantity,
          });
        }
      } else if (item.productType === "paket") {
        const bundleItemsResult = await db
          .select({
            unitProductId: bundleItems.productId,
            unitQuantity: bundleItems.quantity,
            unitProductName: products.name,
          })
          .from(bundleItems)
          .innerJoin(products, eq(bundleItems.productId, products.id))
          .where(eq(bundleItems.packageId, item.productId));

        for (const bundle of bundleItemsResult) {
          const totalQty = bundle.unitQuantity * item.quantity;
          const existing = productionMap.get(bundle.unitProductId);
          if (existing) {
            existing.totalQuantity += totalQty;
          } else {
            productionMap.set(bundle.unitProductId, {
              name: bundle.unitProductName,
              totalQuantity: totalQty,
            });
          }
        }
      }
    }

    const recap = Array.from(productionMap.entries())
      .map(([productId, data]) => ({
        productId,
        productName: data.name,
        totalQuantity: data.totalQuantity,
      }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity);

    return {
      period: { startDate, endDate },
      totalOrders: new Set(orderItemsResult.map((i) => i.orderId)).size,
      totalUniqueProducts: recap.length,
      recap,
    };
  },
};
