import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { env } from "./config/env";
import { authMiddleware } from "./middleware/auth";

// Routes
import authRoutes from "./routes/auth";
import productRoutes from "./routes/products";
import customerRoutes from "./routes/customers";
import orderRoutes from "./routes/orders";
import invoiceRoutes from "./routes/invoices";
import walletRoutes from "./routes/wallet";
import webhookRoutes from "./routes/webhooks";
import reportRoutes from "./routes/reports";

const app = new Hono();

// ============================================================
// Global Middleware
// ============================================================
app.use("*", cors());
app.use("*", logger());

// ============================================================
// Health Check
// ============================================================
app.get("/", (c) => {
  return c.json({
    name: "Makar API",
    version: "1.1.0",
    description: "Manajemen Katering - API & Backend Services",
    status: "running",
  });
});

// ============================================================
// Public Routes (No Auth Required)
// ============================================================
app.route("/api/auth", authRoutes);

// Webhook - no auth (called by Mayar externally)
app.route("/api/webhooks", webhookRoutes);

// Public routes - no auth (customer-facing)
import publicRoutes from "./routes/public";
app.route("/api/public", publicRoutes);

// ============================================================
// Protected Routes (Auth Required - Tenant Isolated)
// ============================================================
app.use("/api/products/*", authMiddleware);
app.use("/api/customers/*", authMiddleware);
app.use("/api/orders/*", authMiddleware);
app.use("/api/invoices/*", authMiddleware);
app.use("/api/wallet/*", authMiddleware);
app.use("/api/reports/*", authMiddleware);

app.route("/api/products", productRoutes);
app.route("/api/customers", customerRoutes);
app.route("/api/orders", orderRoutes);
app.route("/api/invoices", invoiceRoutes);
app.route("/api/wallet", walletRoutes);
app.route("/api/reports", reportRoutes);

// ============================================================
// 404 Handler
// ============================================================
app.notFound((c) => {
  return c.json({ error: "Endpoint tidak ditemukan" }, 404);
});

// ============================================================
// Error Handler
// ============================================================
app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json({ error: "Internal server error" }, 500);
});

// ============================================================
// Start Server
// ============================================================
console.log(`🚀 Makar API running on http://localhost:${env.PORT}`);

export default {
  port: env.PORT,
  fetch: app.fetch,
};
