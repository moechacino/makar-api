import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serveStatic } from "hono/bun";
import { env } from "./config/env";
import { authMiddleware } from "./middleware/auth";
import { db } from "./db";
import { supportUsers } from "./db/schema";
import { eq } from "drizzle-orm";

// Routes
import authRoutes from "./routes/auth";
import productRoutes from "./routes/products";
import customerRoutes from "./routes/customers";
import orderRoutes from "./routes/orders";
import invoiceRoutes from "./routes/invoices";
import walletRoutes from "./routes/wallet";
import webhookRoutes from "./routes/webhooks";
import reportRoutes from "./routes/reports";
import settingsRoutes from "./routes/settings";
import supportRoutes from "./routes/support";

const app = new Hono();

const allowedOrigins = ["http://localhost:3000", "https://makar.lanaksa.my.id"];

// ============================================================
// Global Middleware
// ============================================================
app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return "*";
      return allowedOrigins.includes(origin) ? origin : null;
    },
  }),
);
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

// Static files - logo uploads
app.use("/uploads/*", serveStatic({ root: "./" }));

// ============================================================
// Protected Routes (Auth Required - Tenant Isolated)
// ============================================================
app.use("/api/products/*", authMiddleware);
app.use("/api/customers/*", authMiddleware);
app.use("/api/orders/*", authMiddleware);
app.use("/api/invoices/*", authMiddleware);
app.use("/api/wallet/*", authMiddleware);
app.use("/api/reports/*", authMiddleware);
app.use("/api/settings/*", authMiddleware);

app.route("/api/products", productRoutes);
app.route("/api/customers", customerRoutes);
app.route("/api/orders", orderRoutes);
app.route("/api/invoices", invoiceRoutes);
app.route("/api/wallet", walletRoutes);
app.route("/api/reports", reportRoutes);
app.route("/api/settings", settingsRoutes);

// Support (platform-level) — auth handled per-route in the router
app.route("/api/support", supportRoutes);

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

// Seed default support user on startup
(async () => {
  try {
    const existing = await db
      .select({ id: supportUsers.id })
      .from(supportUsers)
      .where(eq(supportUsers.email, env.SUPPORT_DEFAULT_EMAIL))
      .limit(1);

    if (existing.length === 0) {
      const passwordHash = await Bun.password.hash(
        env.SUPPORT_DEFAULT_PASSWORD,
        {
          algorithm: "bcrypt",
          cost: 10,
        },
      );
      await db.insert(supportUsers).values({
        id: crypto.randomUUID(),
        name: env.SUPPORT_DEFAULT_NAME,
        email: env.SUPPORT_DEFAULT_EMAIL,
        passwordHash,
      });
      console.log(
        `✅ Default support user created: ${env.SUPPORT_DEFAULT_EMAIL}`,
      );
    }
  } catch (err) {
    console.error("Failed to seed support user:", err);
  }
})();

console.log(`🚀 Makar API running on http://localhost:${env.PORT}`);

Bun.serve({
  port: env.PORT || 3001,
  hostname: env.HOSTNAME,
  fetch: app.fetch,
});

console.log(`🚀 Makar API benar-benar jalan di port: ${env.PORT || 3001}`);
