import { db, pool } from "../db";
import { invoices } from "../db/schema";
import { eq } from "drizzle-orm";

interface WebhookPayload {
  event?: string;
  data?: {
    transactionId?: string;
    transaction_id?: string;
    status?: string;
    [key: string]: any;
  };
}

export const webhookService = {
  async processMayarPayment(payload: WebhookPayload) {
    const { event: webhookEvent, data: webhookData } = payload;

    if (!webhookData) {
      throw { status: 400, message: "Invalid webhook payload" };
    }

    // Only process successful payment events
    if (webhookEvent !== "payment.received" && webhookData.status !== "paid") {
      return { ignored: true, message: "Event ignored" };
    }

    const transactionId =
      webhookData.transactionId || webhookData.transaction_id;
    if (!transactionId) {
      throw { status: 400, message: "Transaction ID not found" };
    }

    // Find invoice
    const invoiceResult = await db
      .select()
      .from(invoices)
      .where(eq(invoices.mayarTransactionId, transactionId))
      .limit(1);

    if (invoiceResult.length === 0) {
      console.warn(
        `Webhook: Invoice not found for transaction ${transactionId}`,
      );
      throw { status: 404, message: "Invoice not found" };
    }

    const invoice = invoiceResult[0]!;

    if (invoice.status === "paid") {
      return { ignored: true, message: "Invoice already paid" };
    }

    // ACID transaction
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // 1. Update invoice status
      await connection.query(
        "UPDATE invoices SET invoice_status = 'paid', updated_at = NOW() WHERE id = ?",
        [invoice.id],
      );

      // 2. Update order status
      let newOrderStatus = "processing";
      if (invoice.type === "pelunasan") {
        newOrderStatus = "completed";
      }

      await connection.query(
        "UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?",
        [newOrderStatus, invoice.orderId],
      );

      // 3. Calculate net amount and credit tenant
      const invoiceAmount = Number(invoice.amount);
      const platformFee = Number(invoice.platformFee);
      const netAmount = invoiceAmount - platformFee;

      await connection.query(
        "UPDATE tenants SET balance = balance + ?, updated_at = NOW() WHERE id = ?",
        [netAmount, invoice.tenantId],
      );

      // 4. Record wallet mutation
      const mutationId = crypto.randomUUID();
      await connection.query(
        "INSERT INTO wallet_mutations (id, tenant_id, mutation_type, amount, description, reference_id, created_at) VALUES (?, ?, 'credit', ?, ?, ?, NOW())",
        [
          mutationId,
          invoice.tenantId,
          netAmount,
          `Pembayaran Invoice ${invoice.id} - Order ${invoice.orderId} (Fee: Rp ${platformFee.toLocaleString("id-ID")})`,
          invoice.id,
        ],
      );

      await connection.commit();

      console.log(
        `Webhook processed: Invoice ${invoice.id} paid. Net: ${netAmount}, Fee: ${platformFee}`,
      );

      return {
        invoiceId: invoice.id,
        orderId: invoice.orderId,
        netAmount,
        platformFee,
        newOrderStatus,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },
};
