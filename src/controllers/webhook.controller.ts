import type { Context } from "hono";
import { webhookService } from "../services/webhook.service";

export const webhookController = {
  async handleMayar(c: Context) {
    try {
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
