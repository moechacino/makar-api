import { db } from "../db";
import {
  orders,
  orderItems,
  products,
  customers,
  invoices,
} from "../db/schema";
import { eq, and, sql } from "drizzle-orm";

interface CreateOrderInput {
  customerId: string;
  eventDate?: string;
  deliveryAddress?: string;
  shippingFee: number;
  tax: number;
  paymentType: "full" | "termin";
  items: { productId: string; quantity: number }[];
}

interface UpdateOrderInput {
  eventDate?: string;
  deliveryAddress?: string;
  shippingFee?: number;
  tax?: number;
  status?: string;
}

async function generateOrderId(): Promise<string> {
  const today = new Date();
  const dateStr =
    today.getFullYear().toString() +
    String(today.getMonth() + 1).padStart(2, "0") +
    String(today.getDate()).padStart(2, "0");

  const prefix = `ORD-${dateStr}-`;

  const existing = await db
    .select({ id: orders.id })
    .from(orders)
    .where(sql`${orders.id} LIKE ${prefix + "%"}`)
    .orderBy(sql`${orders.id} DESC`)
    .limit(1);

  let seq = 1;
  if (existing.length > 0) {
    const lastSeq = parseInt(existing[0]!.id.slice(prefix.length), 10);
    seq = (isNaN(lastSeq) ? 0 : lastSeq) + 1;
  }

  return `${prefix}${String(seq).padStart(3, "0")}`;
}

export const orderService = {
  async list(tenantId: string) {
    const allOrders = await db
      .select({
        id: orders.id,
        accessToken: orders.accessToken,
        customerId: orders.customerId,
        customerName: customers.name,
        eventDate: orders.eventDate,
        deliveryAddress: orders.deliveryAddress,
        subtotal: orders.subtotal,
        shippingFee: orders.shippingFee,
        tax: orders.tax,
        totalAmount: orders.totalAmount,
        paymentType: orders.paymentType,
        status: orders.status,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .where(eq(orders.tenantId, tenantId))
      .orderBy(sql`${orders.createdAt} DESC`);

    const orderIds = allOrders.map((o) => o.id);
    if (orderIds.length === 0) return [];

    const allInvoices = await db
      .select({
        id: invoices.id,
        orderId: invoices.orderId,
        type: invoices.type,
        amount: invoices.amount,
        status: invoices.status,
        paymentLink: invoices.mayarPaymentLink,
        createdAt: invoices.createdAt,
      })
      .from(invoices)
      .where(eq(invoices.tenantId, tenantId));

    const invoiceMap = new Map<string, typeof allInvoices>();
    for (const inv of allInvoices) {
      const list = invoiceMap.get(inv.orderId) ?? [];
      list.push(inv);
      invoiceMap.set(inv.orderId, list);
    }

    return allOrders.map((order) => {
      const orderInvoices = invoiceMap.get(order.id) ?? [];
      const totalPaid = orderInvoices
        .filter((inv) => inv.status === "paid")
        .reduce((sum, inv) => sum + inv.amount, 0);
      return {
        ...order,
        invoices: orderInvoices,
        totalPaid,
        remainingAmount: order.totalAmount - totalPaid,
      };
    });
  },

  async getById(tenantId: string, orderId: string) {
    const orderResult = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)))
      .limit(1);

    if (orderResult.length === 0) {
      throw { status: 404, message: "Pesanan tidak ditemukan" };
    }

    const items = await db
      .select({
        id: orderItems.id,
        productId: orderItems.productId,
        productName: products.name,
        productType: products.type,
        quantity: orderItems.quantity,
        priceAtTime: orderItems.priceAtTime,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, orderId));

    const customer = await db
      .select()
      .from(customers)
      .where(eq(customers.id, orderResult[0]!.customerId))
      .limit(1);

    const orderInvoices = await db
      .select({
        id: invoices.id,
        type: invoices.type,
        amount: invoices.amount,
        status: invoices.status,
        paymentLink: invoices.mayarPaymentLink,
        createdAt: invoices.createdAt,
      })
      .from(invoices)
      .where(eq(invoices.orderId, orderId));

    const totalPaid = orderInvoices
      .filter((inv) => inv.status === "paid")
      .reduce((sum, inv) => sum + inv.amount, 0);

    return {
      ...orderResult[0],
      customer: customer[0] ?? null,
      items,
      invoices: orderInvoices,
      totalPaid,
      remainingAmount: orderResult[0]!.totalAmount - totalPaid,
    };
  },

  async create(tenantId: string, input: CreateOrderInput) {
    // Verify customer belongs to tenant
    const customerCheck = await db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.id, input.customerId),
          eq(customers.tenantId, tenantId),
        ),
      )
      .limit(1);

    if (customerCheck.length === 0) {
      throw { status: 404, message: "Pelanggan tidak ditemukan" };
    }

    // Fetch product prices and validate
    const productIds = input.items.map((item) => item.productId);
    const productResults = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.tenantId, tenantId),
          sql`${products.id} IN (${sql.join(
            productIds.map((id) => sql`${id}`),
            sql`, `,
          )})`,
        ),
      );

    const productMap = new Map(productResults.map((p) => [p.id, p]));

    for (const item of input.items) {
      if (!productMap.has(item.productId)) {
        throw {
          status: 404,
          message: `Produk ${item.productId} tidak ditemukan`,
        };
      }
    }

    let subtotal = 0;
    const itemsWithPrice = input.items.map((item) => {
      const product = productMap.get(item.productId)!;
      const price = product.sellPrice;
      subtotal += price * item.quantity;
      return { ...item, priceAtTime: price };
    });

    const totalAmount = subtotal + input.shippingFee + input.tax;
    const orderId = await generateOrderId();
    const accessToken = crypto.randomUUID().replace(/-/g, "");

    await db.insert(orders).values({
      id: orderId,
      accessToken,
      tenantId,
      customerId: input.customerId,
      eventDate: input.eventDate ? new Date(input.eventDate) : null,
      deliveryAddress: input.deliveryAddress ?? null,
      subtotal,
      shippingFee: input.shippingFee,
      tax: input.tax,
      totalAmount,
      paymentType: input.paymentType,
      status: "draft",
    });

    const orderItemValues = itemsWithPrice.map((item) => ({
      orderId,
      productId: item.productId,
      quantity: item.quantity,
      priceAtTime: item.priceAtTime,
    }));

    await db.insert(orderItems).values(orderItemValues);

    return {
      id: orderId,
      accessToken,
      subtotal,
      shippingFee: input.shippingFee,
      tax: input.tax,
      totalAmount,
      status: "draft" as const,
    };
  },

  async update(tenantId: string, orderId: string, input: UpdateOrderInput) {
    const existing = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)))
      .limit(1);

    if (existing.length === 0) {
      throw { status: 404, message: "Pesanan tidak ditemukan" };
    }

    const updateData: Record<string, any> = { updatedAt: new Date() };

    if (input.eventDate !== undefined)
      updateData.eventDate = new Date(input.eventDate);
    if (input.deliveryAddress !== undefined)
      updateData.deliveryAddress = input.deliveryAddress;
    if (input.status !== undefined) updateData.status = input.status;

    if (input.shippingFee !== undefined || input.tax !== undefined) {
      const shipping = input.shippingFee ?? existing[0]!.shippingFee;
      const tax = input.tax ?? existing[0]!.tax;
      const subtotal = existing[0]!.subtotal;
      updateData.shippingFee = shipping;
      updateData.tax = tax;
      updateData.totalAmount = subtotal + shipping + tax;
    }

    await db
      .update(orders)
      .set(updateData)
      .where(and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)));
  },

  async remove(tenantId: string, orderId: string) {
    const existing = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)))
      .limit(1);

    if (existing.length === 0) {
      throw { status: 404, message: "Pesanan tidak ditemukan" };
    }

    if (existing[0]!.status !== "draft") {
      throw {
        status: 400,
        message: "Hanya pesanan dengan status draft yang bisa dihapus",
      };
    }

    await db.delete(orderItems).where(eq(orderItems.orderId, orderId));
    await db
      .delete(orders)
      .where(and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)));
  },

  async getPublicDetail(orderId: string, accessToken: string) {
    const orderResult = await db
      .select({
        id: orders.id,
        accessToken: orders.accessToken,
        eventDate: orders.eventDate,
        deliveryAddress: orders.deliveryAddress,
        subtotal: orders.subtotal,
        shippingFee: orders.shippingFee,
        tax: orders.tax,
        totalAmount: orders.totalAmount,
        paymentType: orders.paymentType,
        status: orders.status,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (orderResult.length === 0) {
      throw { status: 404, message: "Pesanan tidak ditemukan" };
    }

    const order = orderResult[0]!;

    if (order.accessToken !== accessToken) {
      throw { status: 404, message: "Pesanan tidak ditemukan" };
    }

    const customer = await db
      .select({
        name: customers.name,
        phone: customers.phone,
        email: customers.email,
      })
      .from(customers)
      .innerJoin(orders, eq(orders.customerId, customers.id))
      .where(eq(orders.id, orderId))
      .limit(1);

    const items = await db
      .select({
        productName: products.name,
        quantity: orderItems.quantity,
        priceAtTime: orderItems.priceAtTime,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, orderId));

    const orderInvoices = await db
      .select({
        id: invoices.id,
        type: invoices.type,
        amount: invoices.amount,
        status: invoices.status,
        paymentLink: invoices.mayarPaymentLink,
        createdAt: invoices.createdAt,
      })
      .from(invoices)
      .where(eq(invoices.orderId, orderId));

    const totalPaid = orderInvoices
      .filter((inv) => inv.status === "paid")
      .reduce((sum, inv) => sum + inv.amount, 0);

    const remainingAmount = order.totalAmount - totalPaid;

    return {
      ...order,
      accessToken: undefined,
      customer: customer[0] ?? null,
      items,
      invoices: orderInvoices,
      totalPaid,
      remainingAmount,
    };
  },
};
