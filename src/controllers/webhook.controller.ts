import type { Context } from "hono";
import { webhookService } from "../services/webhook.service";
import { env } from "../config/env";

export const webhookController = {
  async handleMayar(c: Context) {
    try {
      // Verify webhook token from Mayar
      const webhookToken = c.req.header("x-webhook-token");
      if (env.MAYAR_WEBHOOK_TOKEN && webhookToken !== env.MAYAR_WEBHOOK_TOKEN) {
        return c.json({ error: "Invalid webhook token" }, 401);
      }

      const body = await c.req.json();
      const result = await webhookService.processMayarPayment(body);

      if ("ignored" in result) {
        return c.json({ message: result.message }, 200);
      }

      return c.json({
        message: "Webhook processed successfully",
        data: result,
      });
    } catch (error: any) {
      if (error.status) return c.json({ error: error.message }, error.status);
      console.error("Webhook error:", error);
      return c.json(
        { error: "Webhook processing failed: " + error.message },
        500,
      );
    }
  },
};
