# **Backend System Requirements Document**

**Nama Proyek:** Makar (Manajemen Katering) \- API & Backend Services

**Tech Stack Utama:** Bun (Runtime), Hono (Web Framework), MariaDB (Database), Drizzle ORM (Database Toolkit)

**Versi:** 1.1 (Multi-Tenant SaaS dengan Model Escrow/Platform)

## **1\. Arsitektur Sistem (System Architecture)**

Backend Makar akan dibangun menggunakan arsitektur **RESTful API** dengan pendekatan **Multi-Tenant SaaS** (Shared Database, Shared Schema). Sistem pembayaran menggunakan model **Platform/Escrow**, di mana platform Makar bertindak sebagai penengah (menggunakan 1 API Key Master).

- **Runtime:** Bun (dipilih karena kecepatan eksekusi dan _package management_ bawaan yang super cepat).
- **Framework:** Hono (sangat ringan, _edge-ready_, dan _routing_ yang dioptimalkan untuk Bun).
- **Database:** MariaDB (Relasional database).
- **ORM:** Drizzle ORM (_Type-safe_, performa tinggi).
- **Data Isolation:** Isolasi data dilakukan di level aplikasi. Setiap baris data di database akan memiliki relasi ke tenant_id.

## **2\. Desain Skema Database (Entity Relationship)**

Menggunakan Drizzle ORM, berikut adalah rancangan entitas tabel:

1. **tenants** (Entitas Bisnis Katering / Workspace)
   - id (UUID/CUID)
   - name (Nama Katering)
   - slug (Unique, misal: 'katering-bu-ani')
   - bank_code (Kode Bank, misal: 'BCA', 'MANDIRI')
   - bank_account_number (Nomor Rekening)
   - bank_account_name (Atas Nama Rekening)
   - balance (Decimal/Int \- Saldo saat ini yang bisa ditarik)
   - created_at, updated_at
2. **users** (Admin & Owner)
   - id (UUID/CUID)
   - tenant_id (FK to tenants)
   - name, email (Unique), password_hash
   - role (ENUM: 'admin', 'owner')
3. **customers** (Buku Kontak Pelanggan)
   - id (UUID/CUID)
   - tenant_id (FK to tenants)
   - name, phone, email, default_address
4. **products** (Menu/Paket)
   - id (UUID/CUID)
   - tenant_id (FK to tenants)
   - name, description, category
   - type (ENUM: 'satuan', 'paket')
   - cogs_price (Harga Modal), sell_price (Harga Jual)
   - is_active (Boolean)

4b. **bundle_items** (Relasi Isi Paket/Bundle) \-\> _Tabel Baru_

- id (UUID/CUID)
- package_id (FK to products.id \- Khusus product dengan type 'paket')
- product_id (FK to products.id \- Khusus product dengan type 'satuan')
- quantity (Int \- Jumlah produk satuan di dalam paket tersebut)

5. **orders** (Pesanan Utama)
   - id (String format misal: ORD-20231020-001)
   - tenant_id (FK to tenants)
   - customer_id (FK to customers)
   - event_date (Datetime)
   - delivery_address (Text)
   - subtotal, shipping_fee, tax, total_amount
   - payment_type (ENUM: 'full', 'termin')
   - status (ENUM: 'draft', 'waiting_dp', 'processing', 'delivered', 'waiting_payment', 'completed', 'cancelled')
6. **order_items** (Detail Produk dalam Pesanan)
   - id (UUID/CUID)
   - order_id (FK to orders)
   - product_id (FK to products)
   - quantity (Int)
   - price_at_time (Harga saat dipesan)
7. **invoices** (Tagihan / Payment Links)
   - id (UUID/CUID)
   - tenant_id (FK to tenants)
   - order_id (FK to orders)
   - type (ENUM: 'dp', 'pelunasan', 'full')
   - amount (Decimal/Int)
   - platform_fee (Decimal/Int \- Potongan komisi Makar jika ada)
   - mayar_payment_link (String URL)
   - mayar_transaction_id (String)
   - status (ENUM: 'unpaid', 'paid', 'expired')
8. **wallet_mutations** (Riwayat Mutasi Saldo Tenant)
   - id (UUID/CUID)
   - tenant_id (FK to tenants)
   - type (ENUM: 'credit', 'debit') \-\> _Credit_ masuk, _Debit_ keluar
   - amount (Decimal/Int)
   - description (Text, ex: "Pembayaran Invoice INV-001" atau "Penarikan Dana")
   - reference_id (FK to invoices OR withdrawals)
   - created_at (Datetime)
9. **withdrawals** (Permintaan Pencairan Dana)
   - id (UUID/CUID)
   - tenant_id (FK to tenants)
   - amount (Decimal/Int)
   - bank_info_snapshot (JSON \- Menyimpan data bank saat ditarik untuk riwayat)
   - status (ENUM: 'pending', 'processing', 'completed', 'failed')
   - disbursement_id (String \- ID dari API Disbursement Mayar jika diotomatisasi)
   - created_at, completed_at

## **3\. Spesifikasi API Endpoints (Hono Routes)**

### **A. Authentication & Onboarding (/api/auth)**

- POST /register-tenant: Mendaftar katering baru (Menyimpan data tenant & user).
- POST /login: Mendapatkan JWT. **Token memuat tenant_id**.

### **B. Core Business Entities (/api/products, /api/customers, /api/orders)**

- CRUD Standar (Isolasi data menggunakan JWT tenant_id).

### **C. Invoicing & Mayar Integration (/api/invoices)**

- POST /order/:orderId/generate:
  - Backend memanggil API Mayar menggunakan **Master API Key milik platform Makar** yang ada di .env.
  - Menyimpan _payment link_ ke tabel invoices.

### **D. Wallet & Withdrawals (/api/wallet)**

- GET /: Mendapatkan saldo terkini tenant.balance dan daftar riwayat wallet_mutations.
- POST /withdraw:
  - Tenant me-request pencairan dana.
  - **Validasi:** Cek apakah amount \<= tenant.balance.
  - **Action:** Kurangi tenant.balance, catat di wallet_mutations (debit), dan buat record di withdrawals (status: pending).

### **E. Webhook Listener (/api/webhooks)**

- POST /mayar: Menerima callback saat pelanggan bayar. Update status Invoice dan Order. **Tambah saldo tenant** di tabel tenants dan catat di wallet_mutations (kredit).

### **F. Reports & Analytics (/api/reports)**

- GET /kitchen-recap:
  - **Logic Rekap Dapur Cerdas:** Backend akan melakukan query ke order_items. Jika item yang dipesan adalah type: 'satuan', langsung jumlahkan. Jika item adalah type: 'paket', backend akan melakukan JOIN ke tabel bundle_items untuk memecah paket tersebut menjadi produk satuan dan mengalikannya dengan quantity pesanan, sehingga tim dapur mendapat laporan produksi satuan yang sangat akurat.

## **4\. Alur Integrasi Model Escrow (Platform Flow)**

1. **Uang Masuk (Customer \-\> Platform):** Pelanggan membayar pesanan katering via Mayar.id. Uang masuk ke akun bank / akun Mayar milik Developer (Makar).
2. **Pencatatan Saldo Internal:** Webhook masuk, sistem memverifikasi tagihan. Jika valid, sistem memotong biaya admin platform (opsional, misal Rp 2.000 atau 1%) dan menambahkan sisa dana tersebut ke kolom balance milik _Tenant_ yang bersangkutan.
3. **Pencairan Dana (Tenant \-\> Rekening Tenant):**
   - Tenant membuka menu "Saldo & Pencairan", lalu klik "Tarik Dana".
   - **Manual Mode (MVP):** Status pencairan menjadi pending. Admin Makar melihat _dashboard_ admin (Superadmin), lalu mentransfer manual via M-Banking. Setelah ditransfer, Admin mengklik tombol "Selesai" dan status menjadi completed.
   - **Auto Mode (Next Phase):** Backend memanggil API _Disbursement_ (Send Money) milik Mayar.id untuk melakukan transfer otomatis secara _real-time_ ke rekening Tenant API.

## **5\. Security & Error Handling (Tenant Isolation)**

- **Tenant-Aware Middleware:** Custom middleware Hono mengekstrak JWT dan meletakkan tenant_id di Context Hono.
- **Strict DB Queries:** Wajib menggunakan eq(table.tenantId, currentTenantId) pada setiap query Drizzle.
- **Database Transactions:** Saat Webhook masuk dan memproses Saldo, **wajib** menggunakan fitur transaksi database (ACID) untuk memastikan Saldo bertambah berbarengan dengan pencatatan wallet*mutations dan perubahan status Invoice. Jika satu gagal, semua harus di-\_rollback* agar uang tidak hilang secara sistem.

## **6\. Development & Deployment Script (Bun)**

- **Development:** bun run \--hot src/index.ts.
- **Migration:** Gunakan Drizzle Kit: bun x drizzle-kit generate:mysql dan bun x drizzle-kit push:mysql.
