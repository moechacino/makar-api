import { Hono } from "hono";
import { webhookController } from "../controllers/webhook.controller";

const webhookRoutes = new Hono();

webhookRoutes.post("/mayar", webhookController.handleMayar);

export default webhookRoutes;
