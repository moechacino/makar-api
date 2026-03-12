import {
  mysqlTable,
  varchar,
  text,
  datetime,
  boolean,
  int,
  mysqlEnum,
  json,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

// ============================================================
// 1. TENANTS (Entitas Bisnis Katering / Workspace)
// ============================================================
export const tenants = mysqlTable("tenants", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  bankCode: varchar("bank_code", { length: 50 }),
  bankAccountNumber: varchar("bank_account_number", { length: 50 }),
  bankAccountName: varchar("bank_account_name", { length: 255 }),
  logoUrl: varchar("logo_url", { length: 500 }),
  balance: int("balance").notNull().default(0),
  createdAt: datetime("created_at")
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: datetime("updated_at")
    .notNull()
    .$defaultFn(() => new Date()),
});

// ============================================================
// 2. USERS (Admin & Owner)
// ============================================================
export const users = mysqlTable("users", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  tenantId: varchar("tenant_id", { length: 128 })
    .notNull()
    .references(() => tenants.id),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["admin", "owner"]).notNull().default("admin"),
  createdAt: datetime("created_at")
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: datetime("updated_at")
    .notNull()
    .$defaultFn(() => new Date()),
});

// ============================================================
// 3. CUSTOMERS (Buku Kontak Pelanggan)
// ============================================================
export const customers = mysqlTable("customers", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  tenantId: varchar("tenant_id", { length: 128 })
    .notNull()
    .references(() => tenants.id),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  defaultAddress: text("default_address"),
  createdAt: datetime("created_at")
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: datetime("updated_at")
    .notNull()
    .$defaultFn(() => new Date()),
});

// ============================================================
// 4. PRODUCTS (Menu / Paket)
// ============================================================
export const products = mysqlTable("products", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  tenantId: varchar("tenant_id", { length: 128 })
    .notNull()
    .references(() => tenants.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  type: mysqlEnum("type", ["satuan", "paket"]).notNull().default("satuan"),
  cogsPrice: int("cogs_price").notNull().default(0),
  sellPrice: int("sell_price").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: datetime("created_at")
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: datetime("updated_at")
    .notNull()
    .$defaultFn(() => new Date()),
});

// ============================================================
// 4b. BUNDLE_ITEMS (Relasi Isi Paket/Bundle)
// ============================================================
export const bundleItems = mysqlTable("bundle_items", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  packageId: varchar("package_id", { length: 128 })
    .notNull()
    .references(() => products.id),
  productId: varchar("product_id", { length: 128 })
    .notNull()
    .references(() => products.id),
  quantity: int("quantity").notNull().default(1),
});

// ============================================================
// 5. ORDERS (Pesanan Utama)
// ============================================================
export const orders = mysqlTable("orders", {
  id: varchar("id", { length: 128 }).primaryKey(), // Format: ORD-20231020-001
  accessToken: varchar("access_token", { length: 64 }).notNull(),
  tenantId: varchar("tenant_id", { length: 128 })
    .notNull()
    .references(() => tenants.id),
  customerId: varchar("customer_id", { length: 128 })
    .notNull()
    .references(() => customers.id),
  eventDate: datetime("event_date"),
  deliveryAddress: text("delivery_address"),
  subtotal: int("subtotal").notNull().default(0),
  shippingFee: int("shipping_fee").notNull().default(0),
  tax: int("tax").notNull().default(0),
  totalAmount: int("total_amount").notNull().default(0),
  dpAmount: int("dp_amount"),
  paymentType: mysqlEnum("payment_type", ["full", "termin"])
    .notNull()
    .default("full"),
  status: mysqlEnum("status", [
    "draft",
    "waiting_dp",
    "waiting_payment",
    "dp_paid",
    "fully_paid",
    "processing",
    "delivered",
    "completed",
    "cancelled",
  ])
    .notNull()
    .default("draft"),
  createdAt: datetime("created_at")
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: datetime("updated_at")
    .notNull()
    .$defaultFn(() => new Date()),
});

// ============================================================
// 6. ORDER_ITEMS (Detail Produk dalam Pesanan)
// ============================================================
export const orderItems = mysqlTable("order_items", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  orderId: varchar("order_id", { length: 128 })
    .notNull()
    .references(() => orders.id),
  productId: varchar("product_id", { length: 128 })
    .notNull()
    .references(() => products.id),
  quantity: int("quantity").notNull().default(1),
  priceAtTime: int("price_at_time").notNull().default(0),
});

// ============================================================
// 7. INVOICES (Tagihan / Payment Links)
// ============================================================
export const invoices = mysqlTable("invoices", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  tenantId: varchar("tenant_id", { length: 128 })
    .notNull()
    .references(() => tenants.id),
  orderId: varchar("order_id", { length: 128 })
    .notNull()
    .references(() => orders.id),
  type: mysqlEnum("type", ["dp", "pelunasan", "full"])
    .notNull()
    .default("full"),
  amount: int("amount").notNull().default(0),
  platformFee: int("platform_fee").notNull().default(0),
  mayarPaymentLink: varchar("mayar_payment_link", { length: 500 }),
  mayarTransactionId: varchar("mayar_transaction_id", { length: 255 }),
  mayarInvoiceId: varchar("mayar_invoice_id", { length: 255 }),
  status: mysqlEnum("invoice_status", ["unpaid", "paid", "expired"])
    .notNull()
    .default("unpaid"),
  createdAt: datetime("created_at")
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: datetime("updated_at")
    .notNull()
    .$defaultFn(() => new Date()),
});

// ============================================================
// 8. WALLET_MUTATIONS (Riwayat Mutasi Saldo Tenant)
// ============================================================
export const walletMutations = mysqlTable("wallet_mutations", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  tenantId: varchar("tenant_id", { length: 128 })
    .notNull()
    .references(() => tenants.id),
  type: mysqlEnum("mutation_type", ["credit", "debit"]).notNull(),
  amount: int("amount").notNull(),
  description: text("description"),
  referenceId: varchar("reference_id", { length: 128 }),
  createdAt: datetime("created_at")
    .notNull()
    .$defaultFn(() => new Date()),
});

// ============================================================
// 9. SUPPORT USERS (Platform-level App Support Accounts)
// ============================================================
export const supportUsers = mysqlTable("support_users", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  createdAt: datetime("created_at")
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: datetime("updated_at")
    .notNull()
    .$defaultFn(() => new Date()),
});

// ============================================================
// 10. WITHDRAWALS (Permintaan Pencairan Dana)
// ============================================================
export const withdrawals = mysqlTable("withdrawals", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  tenantId: varchar("tenant_id", { length: 128 })
    .notNull()
    .references(() => tenants.id),
  amount: int("amount").notNull(),
  bankInfoSnapshot: json("bank_info_snapshot"),
  status: mysqlEnum("withdrawal_status", [
    "pending",
    "processing",
    "completed",
    "failed",
  ])
    .notNull()
    .default("pending"),
  disbursementId: varchar("disbursement_id", { length: 255 }),
  createdAt: datetime("created_at")
    .notNull()
    .$defaultFn(() => new Date()),
  completedAt: datetime("completed_at"),
});

// ============================================================
// RELATIONS
// ============================================================
export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  customers: many(customers),
  products: many(products),
  orders: many(orders),
  invoices: many(invoices),
  walletMutations: many(walletMutations),
  withdrawals: many(withdrawals),
}));

export const usersRelations = relations(users, ({ one }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [customers.tenantId],
    references: [tenants.id],
  }),
  orders: many(orders),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [products.tenantId],
    references: [tenants.id],
  }),
  bundleItemsAsPackage: many(bundleItems),
}));

export const bundleItemsRelations = relations(bundleItems, ({ one }) => ({
  package: one(products, {
    fields: [bundleItems.packageId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [orders.tenantId],
    references: [tenants.id],
  }),
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  orderItems: many(orderItems),
  invoices: many(invoices),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  tenant: one(tenants, {
    fields: [invoices.tenantId],
    references: [tenants.id],
  }),
  order: one(orders, {
    fields: [invoices.orderId],
    references: [orders.id],
  }),
}));

export const walletMutationsRelations = relations(
  walletMutations,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [walletMutations.tenantId],
      references: [tenants.id],
    }),
  }),
);

export const withdrawalsRelations = relations(withdrawals, ({ one }) => ({
  tenant: one(tenants, {
    fields: [withdrawals.tenantId],
    references: [tenants.id],
  }),
}));
