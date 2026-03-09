import { db } from "../db";
import {
  invoices,
  orders,
  orderItems,
  products,
  customers,
  tenants,
} from "../db/schema";
import { eq, and } from "drizzle-orm";
import { mayarClient } from "../lib/mayar";
import { env } from "../config/env";

interface GenerateInvoiceInput {
  type: "dp" | "pelunasan" | "full";
  redirectUrl?: string;
}

export const invoiceService = {
  async list(tenantId: string) {
    return db.select().from(invoices).where(eq(invoices.tenantId, tenantId));
  },

  async getById(tenantId: string, invoiceId: string) {
    const result = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, invoiceId), eq(invoices.tenantId, tenantId)))
      .limit(1);

    if (result.length === 0) {
      throw { status: 404, message: "Invoice tidak ditemukan" };
    }

    return result[0]!;
  },

  async generateForOrder(
    tenantId: string,
    orderId: string,
    input: GenerateInvoiceInput,
  ) {
    // Verify order belongs to tenant
    const orderResult = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)))
      .limit(1);

    if (orderResult.length === 0) {
      throw { status: 404, message: "Pesanan tidak ditemukan" };
    }

    const order = orderResult[0]!;

    // Get customer info
    const customerResult = await db
      .select()
      .from(customers)
      .where(eq(customers.id, order.customerId))
      .limit(1);

    if (customerResult.length === 0) {
      throw { status: 404, message: "Data pelanggan tidak ditemukan" };
    }

    const customer = customerResult[0]!;

    // Get total already paid from existing invoices
    const existingInvoices = await db
      .select({ amount: invoices.amount, status: invoices.status })
      .from(invoices)
      .where(eq(invoices.orderId, orderId));

    const totalPaid = existingInvoices
      .filter((inv) => inv.status === "paid")
      .reduce((sum, inv) => sum + inv.amount, 0);

    const totalPending = existingInvoices
      .filter((inv) => inv.status === "unpaid")
      .reduce((sum, inv) => sum + inv.amount, 0);

    const remainingAmount = order.totalAmount - totalPaid - totalPending;

    // Determine and validate amount
    let invoiceAmount: number;

    if (input.type === "full") {
      // Full: only from draft, no existing invoices
      if (order.status !== "draft") {
        throw {
          status: 400,
          message: "Invoice full hanya bisa dibuat saat status pesanan draft",
        };
      }
      if (totalPaid > 0 || totalPending > 0) {
        throw {
          status: 400,
          message:
            "Tidak bisa membuat invoice full karena sudah ada invoice sebelumnya",
        };
      }
      invoiceAmount = order.totalAmount;
    } else if (input.type === "dp") {
      // DP: only from draft, requires dpAmount
      if (order.status !== "draft") {
        throw {
          status: 400,
          message: "Invoice DP hanya bisa dibuat saat status pesanan draft",
        };
      }
      if (!order.dpAmount) {
        throw {
          status: 400,
          message:
            "Jumlah DP belum ditentukan pada pesanan. Silakan update pesanan dengan dpAmount terlebih dahulu.",
        };
      }
      if (totalPaid > 0 || totalPending > 0) {
        throw {
          status: 400,
          message:
            "Sudah ada invoice sebelumnya. Gunakan tipe pelunasan untuk sisa pembayaran.",
        };
      }
      invoiceAmount = order.dpAmount;
    } else {
      // Pelunasan: only from delivered, termin orders only
      if (order.status !== "delivered") {
        throw {
          status: 400,
          message:
            "Invoice pelunasan hanya bisa dibuat setelah pesanan dikirim (status delivered)",
        };
      }
      if (order.paymentType !== "termin") {
        throw {
          status: 400,
          message:
            "Invoice pelunasan hanya untuk pesanan dengan pembayaran termin/DP",
        };
      }
      if (remainingAmount <= 0) {
        throw {
          status: 400,
          message: "Tidak ada sisa pembayaran. Pesanan sudah lunas.",
        };
      }
      invoiceAmount = remainingAmount;
    }

    const platformFee = env.PLATFORM_FEE;

    // Get order items
    const items = await db
      .select({
        quantity: orderItems.quantity,
        priceAtTime: orderItems.priceAtTime,
        productName: products.name,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, orderId));

    const mayarItems = items.map((item) => ({
      quantity: item.quantity,
      rate: item.priceAtTime,
      description: item.productName,
    }));

    const tenant = await db
      .select({ name: tenants.name })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    const finalItems =
      input.type !== "full"
        ? [
            {
              quantity: 1,
              rate: invoiceAmount,
              description: `${input.type === "dp" ? "DP" : "Pelunasan"} - ${tenant[0]?.name || ""} - Order ${orderId}`,
            },
          ]
        : mayarItems;

    // Call Mayar API
    const mayarResponse = await mayarClient.createInvoice({
      name: customer.name,
      email: customer.email || "",
      mobile: customer.phone || "",
      description: `Invoice untuk Order ${orderId}`,
      items: finalItems,
      redirectUrl: input.redirectUrl,
      extraData: {
        noCustomer: customer.id,
        idProd: orderId,
      },
    });

    // Save invoice
    const invoiceId = crypto.randomUUID();

    await db.insert(invoices).values({
      id: invoiceId,
      tenantId,
      orderId,
      type: input.type,
      amount: invoiceAmount,
      platformFee,
      mayarPaymentLink: mayarResponse.data.link,
      mayarTransactionId: mayarResponse.data.transactionId,
      mayarInvoiceId: mayarResponse.data.id,
      status: "unpaid",
    });

    // Update order status
    const newOrderStatus =
      input.type === "dp" ? "waiting_dp" : "waiting_payment";
    await db
      .update(orders)
      .set({ status: newOrderStatus, updatedAt: new Date() })
      .where(eq(orders.id, orderId));

    return {
      id: invoiceId,
      amount: invoiceAmount,
      platformFee,
      paymentLink: mayarResponse.data.link,
      mayarInvoiceId: mayarResponse.data.id,
      mayarTransactionId: mayarResponse.data.transactionId,
      type: input.type,
      status: "unpaid" as const,
    };
  },
};
