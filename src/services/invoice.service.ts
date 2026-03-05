import { db } from "../db";
import {
  invoices,
  orders,
  orderItems,
  products,
  customers,
} from "../db/schema";
import { eq, and } from "drizzle-orm";
import { mayarClient } from "../lib/mayar";
import { env } from "../config/env";

interface GenerateInvoiceInput {
  type: "dp" | "pelunasan" | "full";
  amount?: number;
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
      if (totalPaid > 0 || totalPending > 0) {
        throw {
          status: 400,
          message:
            "Tidak bisa membuat invoice full karena sudah ada invoice sebelumnya",
        };
      }
      invoiceAmount = order.totalAmount;
    } else if (input.type === "dp") {
      if (!input.amount) {
        throw {
          status: 400,
          message: "Jumlah DP wajib diisi",
        };
      }
      if (input.amount <= 0) {
        throw {
          status: 400,
          message: "Jumlah DP harus lebih dari 0",
        };
      }
      if (input.amount >= order.totalAmount) {
        throw {
          status: 400,
          message: `Jumlah DP harus kurang dari total pesanan (Rp ${order.totalAmount.toLocaleString("id-ID")})`,
        };
      }
      if (input.amount > remainingAmount) {
        throw {
          status: 400,
          message: `Jumlah DP melebihi sisa yang belum dibayar (Rp ${remainingAmount.toLocaleString("id-ID")})`,
        };
      }
      invoiceAmount = input.amount;
    } else {
      // pelunasan — auto-calculate remaining
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

    const finalItems =
      input.type !== "full"
        ? [
            {
              quantity: 1,
              rate: invoiceAmount,
              description: `${input.type === "dp" ? "DP" : "Pelunasan"} - Order ${orderId}`,
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
