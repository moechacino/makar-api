# Makar API Documentation

**Makar** (**Ma**najemen **Ka**te**r**ing) — Multi-tenant Catering Management API & Backend Services.

- **Base URL:** `http://localhost:3000`
- **Content-Type:** `application/json`
- **Authentication:** Bearer Token (JWT)

---

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Endpoints](#endpoints)
  - [Health Check](#health-check)
  - [Auth](#auth)
  - [Products](#products)
  - [Customers](#customers)
  - [Orders](#orders)
  - [Invoices](#invoices)
  - [Wallet](#wallet)
  - [Webhooks](#webhooks)
  - [Reports](#reports)
  - [Settings](#settings)
- [Data Models](#data-models)
- [Environment Variables](#environment-variables)

---

## Overview

Makar API is a multi-tenant SaaS backend for catering businesses. Each tenant (catering business) operates in an isolated workspace sharing the same database. Tenant isolation is enforced through JWT tokens — every authenticated request automatically scopes data to the logged-in tenant.

**Key Features:**

- Multi-tenant architecture with shared DB / shared schema
- Product management (unit items & bundles/packages)
- Customer contact book
- Order lifecycle management with auto-generated IDs (`ORD-YYYYMMDD-NNN`)
- Invoice generation with Mayar.id payment gateway integration (Master API Key / escrow model)
- Internal wallet with ACID-safe balance mutations
- Withdrawal requests with bank info snapshot
- Smart Kitchen Recap report (auto-decomposes bundles into unit production quantities)

---

## Authentication

All protected endpoints require a JWT Bearer token in the `Authorization` header:

```
Authorization: Bearer <token>
```

The JWT payload contains:

```json
{
  "userId": "uuid",
  "tenantId": "uuid",
  "email": "user@example.com",
  "role": "owner | admin"
}
```

Token expiry: **7 days**.

**Public endpoints** (no auth required):

- `POST /api/auth/register-tenant`
- `POST /api/auth/login`
- `POST /api/webhooks/mayar`

---

## Error Handling

All errors follow a consistent format:

```json
{
  "error": "Error message description"
}
```

**Common HTTP status codes:**

| Code | Meaning                   |
| ---- | ------------------------- |
| 200  | Success                   |
| 201  | Created                   |
| 400  | Bad Request / Validation  |
| 401  | Unauthorized              |
| 404  | Not Found                 |
| 409  | Conflict (duplicate data) |
| 500  | Internal Server Error     |

---

## Endpoints

---

### Health Check

#### `GET /`

Returns API status info.

**Auth Required:** No

**Response:**

```json
{
  "name": "Makar API",
  "version": "1.1.0",
  "description": "Manajemen Katering - API & Backend Services",
  "status": "running"
}
```

---

### Auth

#### `POST /api/auth/register-tenant`

Register a new catering business (creates tenant + owner user).

**Auth Required:** No

**Request Body:**

| Field        | Type   | Required | Validation                                    |
| ------------ | ------ | -------- | --------------------------------------------- |
| `tenantName` | string | Yes      | Min 3 characters                              |
| `slug`       | string | Yes      | Min 3 chars, lowercase alphanumeric + hyphens |
| `name`       | string | Yes      | Min 2 characters                              |
| `email`      | string | Yes      | Valid email                                   |
| `password`   | string | Yes      | Min 6 characters                              |

**Example Request:**

```json
{
  "tenantName": "Katering Bu Sari",
  "slug": "katering-bu-sari",
  "name": "Sari Rahayu",
  "email": "sari@example.com",
  "password": "secret123"
}
```

**Response `201`:**

```json
{
  "message": "Registrasi berhasil",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "tenant": {
      "id": "uuid",
      "name": "Katering Bu Sari",
      "slug": "katering-bu-sari"
    },
    "user": {
      "id": "uuid",
      "name": "Sari Rahayu",
      "email": "sari@example.com",
      "role": "owner"
    }
  }
}
```

**Error Responses:**

- `409` — Slug sudah digunakan / Email sudah terdaftar

---

#### `POST /api/auth/login`

Login and receive a JWT token.

**Auth Required:** No

**Request Body:**

| Field      | Type   | Required | Validation  |
| ---------- | ------ | -------- | ----------- |
| `email`    | string | Yes      | Valid email |
| `password` | string | Yes      | Min 1 char  |

**Example Request:**

```json
{
  "email": "sari@example.com",
  "password": "secret123"
}
```

**Response `200`:**

```json
{
  "message": "Login berhasil",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "name": "Sari Rahayu",
      "email": "sari@example.com",
      "role": "owner",
      "tenantId": "uuid"
    }
  }
}
```

**Error Responses:**

- `401` — Email atau password salah

---

### Products

All product endpoints are tenant-scoped (data isolated by JWT tenant_id).

#### `GET /api/products`

List all products for the current tenant.

**Auth Required:** Yes

**Response `200`:**

```json
{
  "data": [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "name": "Nasi Box Premium",
      "description": "Nasi box lengkap dengan lauk premium",
      "category": "nasi-box",
      "type": "satuan",
      "cogsPrice": "15000.00",
      "sellPrice": "35000.00",
      "isActive": true,
      "createdAt": "2026-03-01T10:00:00.000Z",
      "updatedAt": "2026-03-01T10:00:00.000Z"
    }
  ]
}
```

---

#### `GET /api/products/:id`

Get product detail. If the product is a bundle (`type: "paket"`), includes `bundleItems`.

**Auth Required:** Yes

**Response `200`:**

```json
{
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "name": "Paket Prasmanan A",
    "type": "paket",
    "cogsPrice": "50000.00",
    "sellPrice": "120000.00",
    "isActive": true,
    "bundleItems": [
      {
        "id": "uuid",
        "productId": "uuid-nasi-goreng",
        "quantity": 1,
        "productName": "Nasi Goreng",
        "productSellPrice": "25000.00"
      },
      {
        "id": "uuid",
        "productId": "uuid-ayam-bakar",
        "quantity": 2,
        "productName": "Ayam Bakar",
        "productSellPrice": "30000.00"
      }
    ]
  }
}
```

**Error Responses:**

- `404` — Produk tidak ditemukan

---

#### `POST /api/products`

Create a new product.

**Auth Required:** Yes

**Request Body:**

| Field         | Type    | Required | Default    | Description                               |
| ------------- | ------- | -------- | ---------- | ----------------------------------------- |
| `name`        | string  | Yes      | —          | Product name                              |
| `description` | string  | No       | `null`     | Product description                       |
| `category`    | string  | No       | `null`     | Category label                            |
| `type`        | enum    | No       | `"satuan"` | `"satuan"` (unit) or `"paket"` (bundle)   |
| `cogsPrice`   | number  | No       | `0`        | Cost of goods sold                        |
| `sellPrice`   | number  | No       | `0`        | Selling price                             |
| `isActive`    | boolean | No       | `true`     | Whether the product is available          |
| `bundleItems` | array   | No       | —          | Required when `type` is `"paket"` (below) |

**`bundleItems` array items:**

| Field       | Type   | Required | Description                    |
| ----------- | ------ | -------- | ------------------------------ |
| `productId` | string | Yes      | ID of the unit product         |
| `quantity`  | number | Yes      | Quantity of product per bundle |

**Example Request (bundle):**

```json
{
  "name": "Paket Prasmanan A",
  "type": "paket",
  "cogsPrice": 50000,
  "sellPrice": 120000,
  "bundleItems": [
    { "productId": "uuid-nasi-goreng", "quantity": 1 },
    { "productId": "uuid-ayam-bakar", "quantity": 2 }
  ]
}
```

**Response `201`:**

```json
{
  "message": "Produk berhasil dibuat",
  "data": { "id": "uuid" }
}
```

---

#### `PUT /api/products/:id`

Update an existing product. All fields are optional.

**Auth Required:** Yes

**Request Body:**

| Field         | Type    | Required | Description                       |
| ------------- | ------- | -------- | --------------------------------- |
| `name`        | string  | No       | Product name                      |
| `description` | string  | No       | Product description               |
| `category`    | string  | No       | Category label                    |
| `cogsPrice`   | number  | No       | Cost of goods sold                |
| `sellPrice`   | number  | No       | Selling price                     |
| `isActive`    | boolean | No       | Active status                     |
| `bundleItems` | array   | No       | Replace bundle items (paket only) |

**Response `200`:**

```json
{
  "message": "Produk berhasil diperbarui"
}
```

**Error Responses:**

- `404` — Produk tidak ditemukan

---

#### `DELETE /api/products/:id`

Delete a product. If the product is a bundle, its bundle items are also deleted.

**Auth Required:** Yes

**Response `200`:**

```json
{
  "message": "Produk berhasil dihapus"
}
```

**Error Responses:**

- `404` — Produk tidak ditemukan

---

### Customers

Tenant-scoped customer contact book.

#### `GET /api/customers`

List all customers for the current tenant.

**Auth Required:** Yes

**Response `200`:**

```json
{
  "data": [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "name": "PT Maju Jaya",
      "phone": "08123456789",
      "email": "order@majujaya.com",
      "defaultAddress": "Jl. Sudirman No. 10, Jakarta",
      "createdAt": "2026-03-01T10:00:00.000Z",
      "updatedAt": "2026-03-01T10:00:00.000Z"
    }
  ]
}
```

---

#### `GET /api/customers/:id`

Get customer details by ID.

**Auth Required:** Yes

**Response `200`:**

```json
{
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "name": "PT Maju Jaya",
    "phone": "08123456789",
    "email": "order@majujaya.com",
    "defaultAddress": "Jl. Sudirman No. 10, Jakarta"
  }
}
```

**Error Responses:**

- `404` — Pelanggan tidak ditemukan

---

#### `GET /api/customers/phone/:phone`

Get customer details by phone number.

**Auth Required:** Yes

**Path Parameters:**

| Parameter | Type   | Description           |
| --------- | ------ | --------------------- |
| `phone`   | string | Customer phone number |

**Example:** `GET /api/customers/phone/08123456789`

**Response `200`:**

```json
{
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "name": "PT Maju Jaya",
    "phone": "08123456789",
    "email": "order@majujaya.com",
    "defaultAddress": "Jl. Sudirman No. 10, Jakarta"
  }
}
```

**Error Responses:**

- `404` — Pelanggan dengan nomor telepon tersebut tidak ditemukan

---

#### `POST /api/customers`

Create a new customer.

**Auth Required:** Yes

**Request Body:**

| Field            | Type   | Required | Description              |
| ---------------- | ------ | -------- | ------------------------ |
| `name`           | string | Yes      | Customer name            |
| `phone`          | string | No       | Phone number             |
| `email`          | string | No       | Valid email              |
| `defaultAddress` | string | No       | Default delivery address |

**Example Request:**

```json
{
  "name": "PT Maju Jaya",
  "phone": "08123456789",
  "email": "order@majujaya.com",
  "defaultAddress": "Jl. Sudirman No. 10, Jakarta"
}
```

**Response `201`:**

```json
{
  "message": "Pelanggan berhasil dibuat",
  "data": { "id": "uuid" }
}
```

---

#### `PUT /api/customers/:id`

Update a customer. All fields are optional.

**Auth Required:** Yes

**Request Body:**

| Field            | Type   | Required | Description     |
| ---------------- | ------ | -------- | --------------- |
| `name`           | string | No       | Customer name   |
| `phone`          | string | No       | Phone number    |
| `email`          | string | No       | Valid email     |
| `defaultAddress` | string | No       | Default address |

**Response `200`:**

```json
{
  "message": "Pelanggan berhasil diperbarui"
}
```

**Error Responses:**

- `404` — Pelanggan tidak ditemukan

---

#### `DELETE /api/customers/:id`

Delete a customer.

**Auth Required:** Yes

**Response `200`:**

```json
{
  "message": "Pelanggan berhasil dihapus"
}
```

**Error Responses:**

- `404` — Pelanggan tidak ditemukan

---

### Orders

Order lifecycle management with auto-generated sequential IDs.

#### Order Status Flow

**Full Payment Flow:**

```
draft → waiting_payment → fully_paid → processing → delivered → completed
```

**Termin (DP) Payment Flow:**

```
draft → waiting_dp → dp_paid → processing → delivered → completed
                                                  │
                                    (generate pelunasan invoice)
                                                  │
                                    pelunasan paid → completed
```

| Status            | Description                                                     |
| ----------------- | --------------------------------------------------------------- |
| `draft`           | Order created, not yet invoiced                                 |
| `waiting_dp`      | DP invoice generated, awaiting DP payment                       |
| `waiting_payment` | Full invoice generated, awaiting payment                        |
| `dp_paid`         | DP invoice paid, ready for kitchen                              |
| `fully_paid`      | Full invoice paid, ready for kitchen                            |
| `processing`      | Kitchen is preparing the order                                  |
| `delivered`       | Order has been delivered (can generate pelunasan for DP orders) |
| `completed`       | All payments received and order complete                        |
| `cancelled`       | Order cancelled                                                 |

**Status Transitions:**

| Trigger                     | From                   | To                |
| --------------------------- | ---------------------- | ----------------- |
| Generate DP invoice         | `draft`                | `waiting_dp`      |
| Generate Full invoice       | `draft`                | `waiting_payment` |
| DP invoice paid (webhook)   | `waiting_dp`           | `dp_paid`         |
| Full invoice paid (webhook) | `waiting_payment`      | `fully_paid`      |
| Kitchen starts (manual)     | `dp_paid`/`fully_paid` | `processing`      |
| Order delivered (manual)    | `processing`           | `delivered`       |
| Pelunasan paid (webhook)    | `delivered`            | `completed`       |
| Manual complete             | `delivered`            | `completed`       |

---

#### `GET /api/orders`

List all orders for the current tenant, sorted by newest first.

**Auth Required:** Yes

**Response `200`:**

```json
{
  "data": [
    {
      "id": "ORD-20260304-001",
      "accessToken": "a1b2c3d4e5f6...",
      "customerId": "uuid",
      "customerName": "PT Maju Jaya",
      "eventDate": "2026-03-15T00:00:00.000Z",
      "deliveryAddress": "Jl. Sudirman No. 10",
      "subtotal": 350000,
      "shippingFee": 25000,
      "tax": 0,
      "totalAmount": 375000,
      "paymentType": "full",
      "dpAmount": null,
      "status": "draft",
      "createdAt": "2026-03-04T10:00:00.000Z",
      "invoices": [
        {
          "id": "uuid",
          "orderId": "ORD-20260304-001",
          "type": "full",
          "amount": 375000,
          "status": "paid",
          "paymentLink": "https://pay.mayar.club/...",
          "createdAt": "2026-03-04T10:05:00.000Z"
        }
      ],
      "totalPaid": 375000,
      "remainingAmount": 0
    }
  ]
}
```

---

#### `GET /api/orders/:id`

Get order detail including items and customer info.

**Auth Required:** Yes

**Response `200`:**

```json
{
  "data": {
    "id": "ORD-20260304-001",
    "accessToken": "a1b2c3d4e5f6...",
    "tenantId": "uuid",
    "customerId": "uuid",
    "eventDate": "2026-03-15T00:00:00.000Z",
    "deliveryAddress": "Jl. Sudirman No. 10",
    "subtotal": 350000,
    "shippingFee": 25000,
    "tax": 0,
    "totalAmount": 375000,
    "dpAmount": null,
    "paymentType": "full",
    "status": "draft",
    "customer": {
      "id": "uuid",
      "name": "PT Maju Jaya",
      "phone": "08123456789",
      "email": "order@majujaya.com"
    },
    "items": [
      {
        "id": "uuid",
        "productId": "uuid",
        "productName": "Nasi Box Premium",
        "productType": "satuan",
        "quantity": 10,
        "priceAtTime": 35000
      }
    ],
    "invoices": [
      {
        "id": "uuid",
        "orderId": "ORD-20260304-001",
        "type": "full",
        "amount": 375000,
        "status": "paid",
        "paymentLink": "https://pay.mayar.club/...",
        "createdAt": "2026-03-04T10:05:00.000Z"
      }
    ],
    "totalPaid": 375000,
    "remainingAmount": 0
  }
}
```

**Error Responses:**

- `404` — Pesanan tidak ditemukan

---

#### `POST /api/orders`

Create a new order. Order ID is auto-generated with format `ORD-YYYYMMDD-NNN`.

**Auth Required:** Yes

**Request Body:**

| Field             | Type   | Required | Default  | Description                                                   |
| ----------------- | ------ | -------- | -------- | ------------------------------------------------------------- |
| `customerId`      | string | Yes      | —        | Customer UUID                                                 |
| `eventDate`       | string | No       | `null`   | Event date (ISO 8601 string)                                  |
| `deliveryAddress` | string | No       | `null`   | Delivery address                                              |
| `shippingFee`     | number | No       | `0`      | Shipping fee                                                  |
| `tax`             | number | No       | `0`      | Tax amount                                                    |
| `paymentType`     | enum   | No       | `"full"` | `"full"` or `"termin"` (installments)                         |
| `dpAmount`        | number | No       | `null`   | DP amount (required if termin, must be > 0 and < totalAmount) |
| `items`           | array  | Yes      | —        | Min 1 item (see below)                                        |

**`items` array:**

| Field       | Type   | Required | Description            |
| ----------- | ------ | -------- | ---------------------- |
| `productId` | string | Yes      | Product UUID           |
| `quantity`  | number | Yes      | Quantity (integer ≥ 1) |

**Example Request:**

```json
{
  "customerId": "uuid-customer",
  "eventDate": "2026-03-15",
  "deliveryAddress": "Jl. Sudirman No. 10",
  "shippingFee": 25000,
  "tax": 0,
  "paymentType": "termin",
  "dpAmount": 500000,
  "items": [
    { "productId": "uuid-nasi-box", "quantity": 10 },
    { "productId": "uuid-paket-a", "quantity": 5 }
  ]
}
```

**Response `201`:**

```json
{
  "message": "Pesanan berhasil dibuat",
  "data": {
    "id": "ORD-20260304-001",
    "subtotal": 950000,
    "shippingFee": 25000,
    "tax": 0,
    "totalAmount": 975000,
    "dpAmount": 500000,
    "paymentType": "termin",
    "status": "draft"
  }
}
```

**Error Responses:**

- `404` — Pelanggan tidak ditemukan / Produk tidak ditemukan

> **Note:** Prices are captured at order creation time (`priceAtTime`) and won't change if the product price is updated later.

---

#### `PUT /api/orders/:id`

Update an order. Automatically recalculates `totalAmount` if `shippingFee` or `tax` changes.

**Auth Required:** Yes

**Request Body:**

| Field             | Type   | Required | Description                 |
| ----------------- | ------ | -------- | --------------------------- |
| `eventDate`       | string | No       | Event date (ISO 8601)       |
| `deliveryAddress` | string | No       | Delivery address            |
| `shippingFee`     | number | No       | Shipping fee                |
| `tax`             | number | No       | Tax amount                  |
| `status`          | enum   | No       | New order status (see flow) |

**Response `200`:**

```json
{
  "message": "Pesanan berhasil diperbarui"
}
```

**Error Responses:**

- `404` — Pesanan tidak ditemukan

---

#### `DELETE /api/orders/:id`

Delete an order. **Only orders with status `draft` can be deleted.**

**Auth Required:** Yes

**Response `200`:**

```json
{
  "message": "Pesanan berhasil dihapus"
}
```

**Error Responses:**

- `400` — Hanya pesanan dengan status draft yang bisa dihapus
- `404` — Pesanan tidak ditemukan

---

### Invoices

Invoice generation with Mayar.id payment gateway integration using the Master API Key (platform/escrow model).

#### `GET /api/invoices`

List all invoices for the current tenant.

**Auth Required:** Yes

**Response `200`:**

```json
{
  "data": [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "orderId": "ORD-20260304-001",
      "type": "full",
      "amount": "375000.00",
      "platformFee": "2000.00",
      "mayarPaymentLink": "https://app.mayar.id/pay/...",
      "mayarTransactionId": "txn_...",
      "mayarInvoiceId": "inv_...",
      "status": "unpaid",
      "createdAt": "2026-03-04T10:30:00.000Z",
      "updatedAt": "2026-03-04T10:30:00.000Z"
    }
  ]
}
```

---

#### `GET /api/invoices/:id`

Get invoice details.

**Auth Required:** Yes

**Response `200`:**

```json
{
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "orderId": "ORD-20260304-001",
    "type": "full",
    "amount": "375000.00",
    "platformFee": "2000.00",
    "mayarPaymentLink": "https://app.mayar.id/pay/...",
    "mayarTransactionId": "txn_...",
    "mayarInvoiceId": "inv_...",
    "status": "paid"
  }
}
```

**Error Responses:**

- `404` — Invoice tidak ditemukan

---

#### `POST /api/invoices/order/:orderId/generate`

Generate a payment invoice (and Mayar payment link) for a specific order.

**Auth Required:** Yes

**URL Parameters:**

| Param     | Type   | Description |
| --------- | ------ | ----------- |
| `orderId` | string | Order ID    |

**Request Body:**

| Field         | Type   | Required | Default  | Description                            |
| ------------- | ------ | -------- | -------- | -------------------------------------- |
| `type`        | enum   | No       | `"full"` | `"dp"`, `"pelunasan"`, or `"full"`     |
| `redirectUrl` | string | No       | —        | Redirect URL after payment (valid URL) |

**Invoice Types:**

| Type        | Description                              | Amount Behavior                         |
| ----------- | ---------------------------------------- | --------------------------------------- |
| `full`      | Full payment                             | Uses order `totalAmount`                |
| `dp`        | Down payment (installment first payment) | Uses order `dpAmount`                   |
| `pelunasan` | Final settlement payment                 | Auto-calculates remaining unpaid amount |

> **Note:** Amounts are automatically determined from order data. No `amount` field is needed in the request.
>
> - `full`: blocked if any invoice already exists
> - `dp`: requires `dpAmount` to be set on the order, blocked if any invoice already exists
> - `pelunasan`: auto-calculates remaining amount, blocked if already fully paid

**Example Request (DP):**

```json
{
  "type": "dp",
  "redirectUrl": "https://myapp.com/payment-success"
}
```

**Response `201`:**

```json
{
  "message": "Invoice berhasil dibuat",
  "data": {
    "id": "uuid",
    "amount": 200000,
    "platformFee": 2000,
    "paymentLink": "https://app.mayar.id/pay/...",
    "mayarInvoiceId": "inv_...",
    "mayarTransactionId": "txn_...",
    "type": "dp",
    "status": "unpaid"
  }
}
```

**Side Effects:**

- Order status changes to `waiting_dp` (for DP type) or `waiting_payment` (for full/pelunasan)

**Error Responses:**

- `404` — Pesanan tidak ditemukan / Data pelanggan tidak ditemukan

---

### Wallet

Internal tenant wallet for managing income from paid invoices.

#### `GET /api/wallet`

Get current tenant balance and wallet mutation history.

**Auth Required:** Yes

**Response `200`:**

```json
{
  "data": {
    "balance": 573000,
    "mutations": [
      {
        "id": "uuid",
        "tenantId": "uuid",
        "type": "credit",
        "amount": "373000.00",
        "description": "Pembayaran Invoice uuid-inv - Order ORD-20260304-001 (Fee: Rp 2.000)",
        "referenceId": "uuid-inv",
        "createdAt": "2026-03-04T11:00:00.000Z"
      },
      {
        "id": "uuid",
        "tenantId": "uuid",
        "type": "debit",
        "amount": "200000.00",
        "description": "Penarikan Dana - uuid-withdrawal",
        "referenceId": "uuid-withdrawal",
        "createdAt": "2026-03-04T12:00:00.000Z"
      }
    ]
  }
}
```

---

#### `POST /api/wallet/withdraw`

Request a fund withdrawal from the tenant wallet. Uses ACID transaction with row locking.

**Auth Required:** Yes

**Request Body:**

| Field    | Type   | Required | Validation    | Description       |
| -------- | ------ | -------- | ------------- | ----------------- |
| `amount` | number | Yes      | Min Rp 10,000 | Withdrawal amount |

**Example Request:**

```json
{
  "amount": 200000
}
```

**Response `201`:**

```json
{
  "message": "Permintaan penarikan berhasil dibuat",
  "data": {
    "id": "uuid",
    "amount": 200000,
    "newBalance": 173000,
    "status": "pending",
    "bankInfo": {
      "bankCode": "BCA",
      "bankAccountNumber": "1234567890",
      "bankAccountName": "Sari Rahayu"
    }
  }
}
```

**Side Effects:**

- Balance is immediately deducted
- Wallet mutation (debit) is recorded
- Withdrawal record created with `pending` status

**Error Responses:**

- `400` — Saldo tidak mencukupi
- `404` — Tenant tidak ditemukan

---

#### `GET /api/wallet/withdrawals`

List withdrawal request history, sorted by newest first.

**Auth Required:** Yes

**Response `200`:**

```json
{
  "data": [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "amount": "200000.00",
      "bankInfoSnapshot": {
        "bankCode": "BCA",
        "bankAccountNumber": "1234567890",
        "bankAccountName": "Sari Rahayu"
      },
      "status": "pending",
      "disbursementId": null,
      "createdAt": "2026-03-04T12:00:00.000Z",
      "completedAt": null
    }
  ]
}
```

**Withdrawal Statuses:**

| Status       | Description                     |
| ------------ | ------------------------------- |
| `pending`    | Withdrawal requested            |
| `processing` | Being processed by admin/system |
| `completed`  | Funds successfully disbursed    |
| `failed`     | Disbursement failed             |

---

### Webhooks

External callback endpoints called by payment providers.

---

### Public

Customer-facing endpoints. No authentication required.

#### `GET /api/public/orders/:orderId?token=ACCESS_TOKEN`

Get order details with customer info, items, invoices (with payment links), and payment summary. Requires an access token that is returned when the order is created.

**Auth Required:** No

**Path Parameters:**

| Parameter | Type   | Description                        |
| --------- | ------ | ---------------------------------- |
| `orderId` | string | Order ID (e.g. `ORD-20260305-001`) |

**Query Parameters:**

| Parameter | Type   | Required | Description                               |
| --------- | ------ | -------- | ----------------------------------------- |
| `token`   | string | Yes      | Access token (returned on order creation) |

**Response `200`:**

```json
{
  "data": {
    "id": "ORD-20260305-001",
    "eventDate": "2026-03-15T00:00:00.000Z",
    "deliveryAddress": "Jl. Sudirman No. 10, Jakarta Pusat",
    "subtotal": 350000,
    "shippingFee": 25000,
    "tax": 0,
    "totalAmount": 375000,
    "paymentType": "termin",
    "dpAmount": 200000,
    "status": "waiting_dp",
    "createdAt": "2026-03-05T10:00:00.000Z",
    "tenant": {
      "name": "Katering Ibu Sari",
      "logoUrl": "http://localhost:3000/uploads/logos/uuid.jpg"
    },
    "customer": {
      "name": "PT Maju Jaya",
      "phone": "08123456789",
      "email": "order@majujaya.com"
    },
    "items": [
      {
        "productName": "Nasi Box Premium",
        "quantity": 10,
        "priceAtTime": 35000
      }
    ],
    "invoices": [
      {
        "id": "uuid",
        "type": "dp",
        "amount": 200000,
        "status": "unpaid",
        "paymentLink": "https://app.mayar.id/pay/...",
        "createdAt": "2026-03-05T10:05:00.000Z"
      }
    ],
    "totalPaid": 0,
    "remainingAmount": 375000
  }
}
```

**Error Responses:**

- `404` — Pesanan tidak ditemukan

---

#### `POST /api/webhooks/mayar`

Receive payment notification from Mayar.id. Verifies the webhook token and processes successful payments using an ACID transaction.

**Auth Required:** No (called externally by Mayar)

**Request Headers:**

| Header            | Type   | Required | Description                                                                                                |
| ----------------- | ------ | -------- | ---------------------------------------------------------------------------------------------------------- |
| `x-webhook-token` | string | Yes\*    | Webhook token from Mayar dashboard for verification. \*Required when `MAYAR_WEBHOOK_TOKEN` env var is set. |

**Request Body (sent by Mayar):**

```json
{
  "event": "payment.received",
  "data": {
    "id": "9356ec92-32ae-4d99-a1a7-51b11dff4d84",
    "transactionId": "9356ec92-32ae-4d99-a1a7-51b11dff4d84",
    "status": "SUCCESS",
    "transactionStatus": "created",
    "createdAt": 1693817623264,
    "updatedAt": 1693817626638,
    "merchantId": "uuid",
    "merchantName": "Merchant Name",
    "merchantEmail": "merchant@example.com",
    "customerName": "Customer Name",
    "customerEmail": "customer@example.com",
    "customerMobile": "08123456789",
    "amount": 375000,
    "isAdminFeeBorneByCustomer": true,
    "isChannelFeeBorneByCustomer": true,
    "productId": "uuid",
    "productName": "Product Name",
    "productType": "invoice"
  }
}
```

**Webhook Token Verification:**

Mayar sends a token via the `x-webhook-token` header. The server verifies this against the `MAYAR_WEBHOOK_TOKEN` environment variable. If the token doesn't match, the request is rejected with `401`.

**Processed Event:**

Only `payment.received` events with `data.status: "SUCCESS"` are processed. All other events are acknowledged with `200` but ignored.

**Processing Steps (ACID Transaction):**

1. Update invoice status → `paid`
2. Update order status:
   - `dp` invoice → `dp_paid`
   - `full` invoice → `fully_paid`
   - `pelunasan` invoice → `completed`
3. Credit tenant wallet balance (amount minus platform fee)
4. Record wallet mutation (credit)

**Response `200`:**

```json
{
  "message": "Webhook processed successfully",
  "data": {
    "invoiceId": "uuid",
    "orderId": "ORD-20260304-001",
    "netAmount": 373000,
    "platformFee": 2000,
    "newOrderStatus": "dp_paid"
  }
}
```

**Other Responses:**

- `200` `{ "message": "Event ignored" }` — Non-payment events or non-SUCCESS status
- `200` `{ "message": "Invoice already paid" }` — Duplicate webhook (idempotent)
- `400` — Invalid payload / Transaction ID not found
- `401` — Invalid webhook token
- `404` — Invoice not found

---

### Reports

#### `GET /api/reports/kitchen-recap`

**Rekap Dapur Cerdas** (Smart Kitchen Recap) — Production report that breaks down all ordered items (including bundles) into per-unit product quantities for the kitchen.

**Auth Required:** Yes

**Query Parameters:**

| Param       | Type   | Required | Format       | Description       |
| ----------- | ------ | -------- | ------------ | ----------------- |
| `startDate` | string | Yes      | `YYYY-MM-DD` | Period start date |
| `endDate`   | string | Yes      | `YYYY-MM-DD` | Period end date   |

**Example:** `GET /api/reports/kitchen-recap?startDate=2026-03-01&endDate=2026-03-15`

**Bundle Decomposition Logic:**

- Items with `type: "satuan"` → directly summed
- Items with `type: "paket"` → decomposed via `bundle_items` table, each unit product quantity is multiplied by the order quantity

**Example:** If "Paket A" contains `2x Nasi Goreng` + `1x Ayam Bakar`, and a customer orders `10x Paket A`:

- Nasi Goreng → 20 portions
- Ayam Bakar → 10 portions

**Response `200`:**

```json
{
  "data": {
    "period": {
      "startDate": "2026-03-01",
      "endDate": "2026-03-15"
    },
    "totalOrders": 15,
    "totalUniqueProducts": 8,
    "recap": [
      {
        "productId": "uuid-nasi-goreng",
        "productName": "Nasi Goreng",
        "totalQuantity": 120
      },
      {
        "productId": "uuid-ayam-bakar",
        "productName": "Ayam Bakar",
        "totalQuantity": 85
      }
    ]
  }
}
```

> **Note:** Only orders with active statuses are included (excludes `draft` and `cancelled`). The recap is sorted by `totalQuantity` descending.

**Error Responses:**

- `400` — Parameter startDate dan endDate wajib diisi

---

### Settings

Manage tenant profile, logo, bank account, and user account settings.

#### `GET /api/settings/banks`

Get the full list of supported bank codes. Use these codes when updating tenant bank information.

**Auth Required:** Yes

**Response `200`:**

```json
{
  "data": [
    { "code": "014", "name": "Bank BCA" },
    { "code": "008", "name": "Bank Mandiri" },
    { "code": "009", "name": "Bank BNI" },
    { "code": "002", "name": "Bank BRI" }
  ]
}
```

---

#### `GET /api/settings/tenant`

Get current tenant information.

**Auth Required:** Yes

**Response `200`:**

```json
{
  "data": {
    "id": "uuid",
    "name": "Katering Ibu Sari",
    "slug": "katering-ibu-sari",
    "bankCode": "014",
    "bankName": "Bank BCA",
    "bankAccountNumber": "1234567890",
    "bankAccountName": "Sari Dewi",
    "logoUrl": "http://localhost:3000/uploads/logos/uuid.jpg",
    "createdAt": "2026-03-01T00:00:00.000Z",
    "updatedAt": "2026-03-09T10:00:00.000Z"
  }
}
```

---

#### `PUT /api/settings/tenant`

Update tenant information. All fields are optional.

**Auth Required:** Yes

**Request Body:**

| Field               | Type   | Required | Description                                                     |
| ------------------- | ------ | -------- | --------------------------------------------------------------- |
| `name`              | string | No       | Business name (min 2 chars)                                     |
| `slug`              | string | No       | Unique URL slug (lowercase letters, digits, hyphens)            |
| `bankCode`          | string | No       | Bank code — must be a valid code from `GET /api/settings/banks` |
| `bankAccountNumber` | string | No       | Bank account number                                             |
| `bankAccountName`   | string | No       | Account holder name                                             |

**Example Request:**

```json
{
  "name": "Katering Ibu Sari Premium",
  "bankCode": "014",
  "bankAccountNumber": "9876543210",
  "bankAccountName": "Sari Dewi"
}
```

**Response `200`:**

```json
{
  "message": "Informasi tenant berhasil diperbarui",
  "data": {
    "id": "uuid",
    "name": "Katering Ibu Sari Premium",
    "slug": "katering-ibu-sari",
    "bankCode": "014",
    "bankName": "Bank BCA",
    "bankAccountNumber": "9876543210",
    "bankAccountName": "Sari Dewi",
    "logoUrl": "http://localhost:3000/uploads/logos/uuid.jpg",
    "createdAt": "2026-03-01T00:00:00.000Z",
    "updatedAt": "2026-03-09T10:00:00.000Z"
  }
}
```

**Error Responses:**

- `400` — Kode bank tidak valid
- `409` — Slug sudah digunakan oleh tenant lain

---

#### `POST /api/settings/tenant/logo`

Upload or replace the tenant logo. Accepts `multipart/form-data`.

**Auth Required:** Yes

**Content-Type:** `multipart/form-data`

**Form Fields:**

| Field  | Type | Required | Description                                |
| ------ | ---- | -------- | ------------------------------------------ |
| `logo` | file | Yes      | Image file (JPG, PNG, WebP, GIF — max 2MB) |

**Response `200`:**

```json
{
  "message": "Logo berhasil diunggah",
  "data": {
    "logoUrl": "http://localhost:3000/uploads/logos/uuid.jpg"
  }
}
```

**Error Responses:**

- `400` — File logo wajib diunggah / Format tidak didukung / Ukuran > 2MB

> **Note:** The logo is served as a static file at the returned `logoUrl`. Uploading a new logo replaces the previous file.

---

#### `GET /api/settings/profile`

Get current user profile.

**Auth Required:** Yes

**Response `200`:**

```json
{
  "data": {
    "id": "uuid",
    "tenantId": "uuid",
    "name": "Admin Sari",
    "email": "admin@katering-sari.com",
    "role": "owner",
    "createdAt": "2026-03-01T00:00:00.000Z",
    "updatedAt": "2026-03-09T10:00:00.000Z"
  }
}
```

---

#### `PUT /api/settings/profile`

Update user name and/or email.

**Auth Required:** Yes

**Request Body:**

| Field   | Type   | Required | Description                |
| ------- | ------ | -------- | -------------------------- |
| `name`  | string | No       | Display name (min 2 chars) |
| `email` | string | No       | New email address          |

**Response `200`:**

```json
{
  "message": "Profil berhasil diperbarui",
  "data": { "...updated user object..." }
}
```

**Error Responses:**

- `409` — Email sudah digunakan oleh akun lain

---

#### `PUT /api/settings/profile/password`

Change the current user’s password.

**Auth Required:** Yes

**Request Body:**

| Field             | Type   | Required | Description                        |
| ----------------- | ------ | -------- | ---------------------------------- |
| `currentPassword` | string | Yes      | Existing password for verification |
| `newPassword`     | string | Yes      | New password (min 6 chars)         |

**Example Request:**

```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456"
}
```

**Response `200`:**

```json
{
  "message": "Password berhasil diubah"
}
```

**Error Responses:**

- `400` — Password saat ini tidak sesuai

---

## Data Models

### Tenant

| Field               | Type         | Description                  |
| ------------------- | ------------ | ---------------------------- |
| `id`                | varchar(128) | Primary key (UUID)           |
| `name`              | varchar(255) | Business name                |
| `slug`              | varchar(255) | Unique URL slug              |
| `bankCode`          | varchar(50)  | Bank code for withdrawals    |
| `bankAccountNumber` | varchar(50)  | Bank account number          |
| `bankAccountName`   | varchar(255) | Bank account holder name     |
| `logoUrl`           | varchar(500) | Public URL of tenant logo    |
| `balance`           | int          | Current wallet balance (IDR) |
| `createdAt`         | datetime     | Creation timestamp           |
| `updatedAt`         | datetime     | Last update timestamp        |

### User

| Field          | Type         | Description            |
| -------------- | ------------ | ---------------------- |
| `id`           | varchar(128) | Primary key (UUID)     |
| `tenantId`     | varchar(128) | FK → tenants.id        |
| `name`         | varchar(255) | User full name         |
| `email`        | varchar(255) | Unique email           |
| `passwordHash` | varchar(255) | Bcrypt hashed password |
| `role`         | enum         | `"admin"` or `"owner"` |
| `createdAt`    | datetime     | Creation timestamp     |
| `updatedAt`    | datetime     | Last update timestamp  |

### Customer

| Field            | Type         | Description              |
| ---------------- | ------------ | ------------------------ |
| `id`             | varchar(128) | Primary key (UUID)       |
| `tenantId`       | varchar(128) | FK → tenants.id          |
| `name`           | varchar(255) | Customer name            |
| `phone`          | varchar(50)  | Phone number             |
| `email`          | varchar(255) | Email address            |
| `defaultAddress` | text         | Default delivery address |
| `createdAt`      | datetime     | Creation timestamp       |
| `updatedAt`      | datetime     | Last update timestamp    |

### Product

| Field         | Type          | Description                    |
| ------------- | ------------- | ------------------------------ |
| `id`          | varchar(128)  | Primary key (UUID)             |
| `tenantId`    | varchar(128)  | FK → tenants.id                |
| `name`        | varchar(255)  | Product name                   |
| `description` | text          | Product description            |
| `category`    | varchar(100)  | Category label                 |
| `type`        | enum          | `"satuan"` (unit) or `"paket"` |
| `cogsPrice`   | decimal(15,2) | Cost of goods sold             |
| `sellPrice`   | decimal(15,2) | Selling price                  |
| `isActive`    | boolean       | Active/available status        |
| `createdAt`   | datetime      | Creation timestamp             |
| `updatedAt`   | datetime      | Last update timestamp          |

### BundleItem

| Field       | Type         | Description                   |
| ----------- | ------------ | ----------------------------- |
| `id`        | varchar(128) | Primary key                   |
| `packageId` | varchar(128) | FK → products.id (the bundle) |
| `productId` | varchar(128) | FK → products.id (the item)   |
| `quantity`  | int          | Quantity per bundle           |

### Order

| Field             | Type          | Description                     |
| ----------------- | ------------- | ------------------------------- |
| `id`              | varchar(128)  | PK, format: `ORD-YYYYMMDD-NNN`  |
| `tenantId`        | varchar(128)  | FK → tenants.id                 |
| `customerId`      | varchar(128)  | FK → customers.id               |
| `eventDate`       | datetime      | Event / delivery date           |
| `deliveryAddress` | text          | Delivery address                |
| `subtotal`        | decimal(15,2) | Sum of item prices × quantities |
| `shippingFee`     | decimal(15,2) | Shipping fee                    |
| `tax`             | decimal(15,2) | Tax amount                      |
| `totalAmount`     | decimal(15,2) | subtotal + shippingFee + tax    |
| `paymentType`     | enum          | `"full"` or `"termin"`          |
| `status`          | enum          | See order status flow above     |
| `createdAt`       | datetime      | Creation timestamp              |
| `updatedAt`       | datetime      | Last update timestamp           |

### OrderItem

| Field         | Type          | Description                  |
| ------------- | ------------- | ---------------------------- |
| `id`          | varchar(128)  | Primary key (UUID)           |
| `orderId`     | varchar(128)  | FK → orders.id               |
| `productId`   | varchar(128)  | FK → products.id             |
| `quantity`    | int           | Ordered quantity             |
| `priceAtTime` | decimal(15,2) | Price captured at order time |

### Invoice

| Field                | Type          | Description                       |
| -------------------- | ------------- | --------------------------------- |
| `id`                 | varchar(128)  | Primary key (UUID)                |
| `tenantId`           | varchar(128)  | FK → tenants.id                   |
| `orderId`            | varchar(128)  | FK → orders.id                    |
| `type`               | enum          | `"dp"`, `"pelunasan"`, `"full"`   |
| `amount`             | decimal(15,2) | Invoice amount                    |
| `platformFee`        | decimal(15,2) | Platform fee deducted             |
| `mayarPaymentLink`   | varchar(500)  | Mayar payment URL                 |
| `mayarTransactionId` | varchar(255)  | Mayar transaction ID              |
| `mayarInvoiceId`     | varchar(255)  | Mayar invoice ID                  |
| `status`             | enum          | `"unpaid"`, `"paid"`, `"expired"` |
| `createdAt`          | datetime      | Creation timestamp                |
| `updatedAt`          | datetime      | Last update timestamp             |

### WalletMutation

| Field         | Type          | Description                       |
| ------------- | ------------- | --------------------------------- |
| `id`          | varchar(128)  | Primary key (UUID)                |
| `tenantId`    | varchar(128)  | FK → tenants.id                   |
| `type`        | enum          | `"credit"` or `"debit"`           |
| `amount`      | decimal(15,2) | Mutation amount                   |
| `description` | text          | Description                       |
| `referenceId` | varchar(128)  | Reference ID (invoice/withdrawal) |
| `createdAt`   | datetime      | Timestamp                         |

### Withdrawal

| Field              | Type          | Description                                            |
| ------------------ | ------------- | ------------------------------------------------------ |
| `id`               | varchar(128)  | Primary key (UUID)                                     |
| `tenantId`         | varchar(128)  | FK → tenants.id                                        |
| `amount`           | decimal(15,2) | Withdrawal amount                                      |
| `bankInfoSnapshot` | json          | Snapshot of bank info at request time                  |
| `status`           | enum          | `"pending"`, `"processing"`, `"completed"`, `"failed"` |
| `disbursementId`   | varchar(255)  | External disbursement reference                        |
| `createdAt`        | datetime      | Creation timestamp                                     |
| `completedAt`      | datetime      | Completion timestamp                                   |

---

## Environment Variables

| Variable              | Default                        | Description                                                        |
| --------------------- | ------------------------------ | ------------------------------------------------------------------ |
| `DATABASE_HOST`       | `localhost`                    | MariaDB/MySQL host                                                 |
| `DATABASE_PORT`       | `3306`                         | Database port                                                      |
| `DATABASE_USER`       | `root`                         | Database user                                                      |
| `DATABASE_PASSWORD`   | (empty)                        | Database password                                                  |
| `DATABASE_NAME`       | `makar_db`                     | Database name                                                      |
| `JWT_SECRET`          | `change-this-secret`           | Secret key for JWT signing                                         |
| `MAYAR_API_KEY`       | (empty)                        | Mayar.id Master API Key                                            |
| `MAYAR_BASE_URL`      | `https://api.mayar.club/hl/v1` | Mayar API base URL (sandbox)                                       |
| `MAYAR_WEBHOOK_TOKEN` | (empty)                        | Webhook token for verifying Mayar callbacks (from Mayar dashboard) |
| `PLATFORM_FEE`        | `2000`                         | Platform fee per invoice (in IDR)                                  |
| `PORT`                | `3000`                         | Server port                                                        |
| `BASE_URL`            | `http://localhost:3000`        | Public base URL (used to build logo URLs)                          |
| `UPLOAD_DIR`          | `uploads`                      | Directory for storing uploaded files                               |

> **Note:** Bun automatically loads `.env` files — no dotenv package needed.
