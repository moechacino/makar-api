Berikut adalah Dokumentasi API Reference Mayar yang komprehensif dan rapi dalam format Markdown, berdasarkan konten mentah yang Anda berikan:

---

# Referensi API Mayar

Dokumentasi ini menyediakan informasi lengkap mengenai endpoint API Mayar, termasuk metode, URL, parameter, dan contoh permintaan serta respons.

## Daftar Isi

- [Autentikasi](#autentikasi)
- [Invoice](#invoice)
  - [1. Buat Invoice](#1-buat-invoice)
  - [2. Dapatkan Daftar Invoice](#2-dapatkan-daftar-invoice)
  - [3. Dapatkan Detail / Status Invoice](#3-dapatkan-detail--status-invoice)
  - [4. Edit Invoice](#4-edit-invoice)
  - [5. Buka Kembali Invoice](#5-buka-kembali-invoice)
- [Permintaan Pembayaran](#permintaan-pembayaran)
  - [1. Buat Permintaan Pembayaran Tunggal](#1-buat-permintaan-pembayaran-tunggal)
  - [2. Dapatkan Daftar Permintaan Pembayaran Tunggal](#2-dapatkan-daftar-permintaan-pembayaran-tunggal)
  - [3. Dapatkan Detail Permintaan Pembayaran Tunggal](#3-dapatkan-detail-permintaan-pembayaran-tunggal)
  - [4. Edit Permintaan Pembayaran Tunggal](#4-edit-permintaan-pembayaran-tunggal)
  - [5. Tutup Permintaan Pembayaran Tunggal](#5-tutup-permintaan-pembayaran-tunggal)
  - [6. Buka Kembali Permintaan Pembayaran Tunggal](#6-buka-kembali-permintaan-pembayaran-tunggal)
- [Cicilan](#cicilan)
  - [1. Buat Cicilan](#1-buat-cicilan)
  - [2. Dapatkan Detail Cicilan](#2-dapatkan-detail-cicilan)
- [Pelanggan](#pelanggan)
  - [1. Buat Pelanggan](#1-buat-pelanggan)
  - [2. Dapatkan Daftar Pelanggan](#2-dapatkan-daftar-pelanggan)
- [Transaksi QR](#transaksi-qr)
  - [1. Buat QR Code Dinamis](#1-buat-qr-code-dinamis)

---

## Autentikasi

Semua permintaan ke API Mayar memerlukan autentikasi menggunakan Token API Anda. Token ini harus disertakan dalam header `Authorization` dengan skema `Bearer`.

**Header Autentikasi:**

| Nama Header     | Tipe     | Deskripsi                             | Contoh Nilai                     |
| :-------------- | :------- | :------------------------------------ | :------------------------------- |
| `Authorization` | `string` | Token API Anda dengan skema `Bearer`. | `Bearer Paste-Your-API-Key-Here` |

---

## Invoice

Kategori ini mencakup endpoint untuk mengelola invoice, seperti membuat, melihat daftar, melihat detail, mengedit, dan mengubah status invoice.

### 1. Buat Invoice

Endpoint ini digunakan untuk membuat invoice baru.

- **Method:** `POST`
- **Endpoint URL:**
  - **Produksi:** `https://api.mayar.id/hl/v1/invoice/create`
  - **Sandbox:** `https://api.mayar.club/hl/v1/invoice/create`

**Parameter Body:**

| Nama Parameter         | Tipe      | Wajib/Opsional | Deskripsi                                                                                |
| :--------------------- | :-------- | :------------- | :--------------------------------------------------------------------------------------- |
| `name`                 | `string`  | Wajib          | Nama lengkap pelanggan.                                                                  |
| `email`                | `string`  | Wajib          | Alamat email pelanggan.                                                                  |
| `mobile`               | `string`  | Wajib          | Nomor telepon seluler pelanggan.                                                         |
| `redirectUrl`          | `string`  | Opsional       | URL tujuan pengalihan pelanggan setelah pembayaran selesai.                              |
| `description`          | `string`  | Opsional       | Deskripsi atau catatan terkait invoice.                                                  |
| `expiredAt`            | `string`  | Opsional       | Waktu kadaluarsa invoice dalam format ISO 8601 (UTC). Contoh: `2026-04-19T16:43:23.000Z` |
| `items`                | `array`   | Wajib          | Daftar item (produk/layanan) yang dibeli.                                                |
| `items[].quantity`     | `integer` | Wajib          | Jumlah item yang dipesan.                                                                |
| `items[].rate`         | `integer` | Wajib          | Harga per unit barang.                                                                   |
| `items[].description`  | `string`  | Wajib          | Deskripsi item.                                                                          |
| `extraData`            | `object`  | Opsional       | Data kustom tambahan yang dilampirkan ke invoice.                                        |
| `extraData.noCustomer` | `string`  | Opsional       | Nomor referensi pelanggan kustom.                                                        |
| `extraData.idProd`     | `string`  | Opsional       | ID produk kustom yang terkait dengan invoice.                                            |

**Contoh Permintaan (JSON Request):**

```bash
curl --request POST 'https://api.mayar.id/hl/v1/invoice/create' \
--header 'Authorization: Bearer Paste-Your-API-Key-Here' \
--data-raw '{
  "name": "andre jago",
  "email": "alikusnadide@gmail.com",
  "mobile": "085797522261",
  "redirectUrl": "https://kelaskami.com/nexst23",
  "description": "testing dulu pak",
  "expiredAt": "2026-04-19T16:43:23.000Z",
  "items":[
    {
      "quantity": 3,
      "rate": 11000,
      "description": "1e 1 sayam jago"
    }
  ],
  "extraData": {
    "noCustomer": "827hiueqy271hj",
    "idProd": "contoh aja"
  }
}'
```

**Contoh Respons (JSON Response) 200:**

```json
{
  "statusCode": 200,
  "messages": "success",
  "data": {
    "id": "df65d192-8396-4f9a-b4e5-8244648c07c5",
    "transactionId": "ca87fd13-8742-4d48-af33-7de1a417bc34",
    "link": "https://korban-motivator.mayar.shop/invoices/ycfyxbj2h3",
    "expiredAt": 1776617003000,
    "extraData": {
      "noCustomer": "827hiueqy271hj",
      "idProd": "contoh aja"
    }
  }
}
```

**Struktur Respons Sukses (Root):**

| Nama Field                  | Tipe      | Deskripsi                                                                   |
| :-------------------------- | :-------- | :-------------------------------------------------------------------------- |
| `statusCode`                | `integer` | Kode status dari API.                                                       |
| `messages`                  | `string`  | Pesan status yang menjelaskan kode status.                                  |
| `data`                      | `object`  | Data utama yang dikembalikan (detail invoice).                              |
| `data.id`                   | `string`  | ID unik catatan invoice.                                                    |
| `data.transactionId`        | `string`  | ID unik transaksi terkait.                                                  |
| `data.link`                 | `string`  | URL invoice yang dapat diakses oleh pelanggan.                              |
| `data.expiredAt`            | `integer` | Timestamp (dalam milidetik) yang menunjukkan kapan invoice akan kadaluarsa. |
| `data.extraData`            | `object`  | Data kustom tambahan yang dilampirkan ke invoice.                           |
| `data.extraData.noCustomer` | `string`  | Nomor referensi pelanggan kustom.                                           |
| `data.extraData.idProd`     | `string`  | ID produk kustom yang terkait dengan invoice.                               |

---

### 2. Dapatkan Daftar Invoice

Endpoint ini digunakan untuk melihat detail dan daftar invoice yang telah dibuat.

- **Method:** `GET`
- **Endpoint URL:**
  - **Produksi:** `https://api.mayar.id/hl/v1/invoice`
  - **Sandbox:** `https://api.mayar.club/hl/v1/invoice`

**Parameter Header:**

| Nama Header     | Tipe     | Deskripsi                             |
| :-------------- | :------- | :------------------------------------ |
| `Authorization` | `string` | Token API Anda dengan skema `Bearer`. |

**Contoh Permintaan (JSON Request):**

```bash
curl --request GET 'https://api.mayar.id/hl/v1/invoice' \
--header 'Authorization: Bearer Paste-Your-API-Key-Here' \
--data ''
```

**Contoh Respons (JSON Response) 200:**

```json
{
  "statusCode": 200,
  "messages": "success",
  "hasMore": true,
  "pageCount": 2,
  "pageSize": 10,
  "page": 1,
  "data": [
    {
      "id": "01918da0-704b-45d8-bf14-afbd738eb682",
      "amount": 2000,
      "category": null,
      "createdAt": 1691046324713,
      "description": "",
      "link": "75py7f7vwwr",
      "type": "invoice",
      "status": "paid",
      "name": "INVOICE",
      "redirectUrl": null,
      "customerId": "6a38cf26-6bab-42c8-92be-72f3a9fd4c33",
      "transactions": [
        {
          "id": "d442dcbd-6dbb-4e26-aec5-8c4b5f5e13a2",
          "status": "created"
        },
        {
          "id": "5824155d-e125-418e-abb6-bd25e1cb6eaf",
          "status": "paid"
        }
      ],
      "customer": {
        "id": "6a38cf26-6bab-42c8-92be-72f3a9fd4c33",
        "email": "mayartesting05@gmail.com",
        "mobile": "081320547877",
        "name": "Harus Buat auto testing"
      }
    }
  ],
  "total": 17
}
```

**Struktur Respons Sukses (Root):**

| Nama Field   | Tipe      | Deskripsi                                                           |
| :----------- | :-------- | :------------------------------------------------------------------ |
| `statusCode` | `integer` | Kode status dari API.                                               |
| `messages`   | `string`  | Pesan status yang menjelaskan kode status.                          |
| `hasMore`    | `boolean` | Informasi apakah ada data tambahan yang dapat diambil (true/false). |
| `pageCount`  | `integer` | Total jumlah halaman data.                                          |
| `pageSize`   | `integer` | Jumlah item per halaman.                                            |
| `page`       | `integer` | Halaman yang sedang ditampilkan.                                    |
| `data`       | `array`   | Daftar invoice yang ditampilkan.                                    |
| `total`      | `integer` | Total jumlah invoice yang tersedia.                                 |

**Struktur Objek Data dalam `data`:**

| Nama Field     | Tipe      | Deskripsi                                               |
| :------------- | :-------- | :------------------------------------------------------ |
| `id`           | `string`  | ID unik invoice.                                        |
| `amount`       | `integer` | Harga atau nilai nominal invoice.                       |
| `category`     | `string`  | Kategori produk, bisa `null` jika tidak ada kategori.   |
| `createdAt`    | `integer` | Waktu pembuatan produk dalam format epoch milliseconds. |
| `description`  | `string`  | Deskripsi produk.                                       |
| `link`         | `string`  | Slug/URL pendek produk.                                 |
| `type`         | `string`  | Tipe produk (contoh: "invoice").                        |
| `status`       | `string`  | Status produk (contoh: "paid", "closed", "unpaid").     |
| `name`         | `string`  | Nama produk.                                            |
| `redirectUrl`  | `string`  | URL tujuan pengalihan, bisa `null`.                     |
| `customerId`   | `string`  | ID pelanggan yang terkait dengan invoice ini.           |
| `transactions` | `array`   | Daftar transaksi terkait invoice.                       |
| `customer`     | `object`  | Detail pelanggan yang membayar invoice.                 |

**Struktur Objek Transaksi dalam `transactions`:**

| Nama Field | Tipe     | Deskripsi                                     |
| :--------- | :------- | :-------------------------------------------- |
| `id`       | `string` | ID transaksi unik.                            |
| `status`   | `string` | Status transaksi (contoh: "created", "paid"). |

**Struktur Objek Pelanggan dalam `customer`:**

| Nama Field | Tipe     | Deskripsi                        |
| :--------- | :------- | :------------------------------- |
| `id`       | `string` | ID pelanggan unik.               |
| `email`    | `string` | Alamat email pelanggan.          |
| `mobile`   | `string` | Nomor telepon seluler pelanggan. |
| `name`     | `string` | Nama pelanggan.                  |

---

### 3. Dapatkan Detail / Status Invoice

Endpoint ini digunakan untuk melihat detail dan status invoice yang telah dibuat.

- **Method:** `GET`
- **Endpoint URL:**
  - **Produksi:** `https://api.mayar.id/hl/v1/invoice/{id}`
  - **Sandbox:** `https://api.mayar.club/hl/v1/invoice/{id}`

**Parameter Path:**

| Nama Parameter | Tipe     | Wajib/Opsional | Deskripsi                                                                                                                                     |
| :------------- | :------- | :------------- | :-------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`           | `string` | Wajib          | ID unik invoice. Dapat ditemukan di URL halaman detail invoice jika diakses melalui dashboard. Contoh: `f774034d-d9cc-43a0-97d8-a2520c127f03` |

**Parameter Header:**

| Nama Header     | Tipe     | Deskripsi                             |
| :-------------- | :------- | :------------------------------------ |
| `Authorization` | `string` | Token API Anda dengan skema `Bearer`. |

**Contoh Permintaan (JSON Request):**

```bash
curl --request GET 'https://api.mayar.id/hl/v1/invoice/f774034d-d9cc-43a0-97d8-a2520c127f03' \
--header 'Authorization: Bearer Paste-Your-API-Key-Here' \
--data ''
```

**Contoh Respons (JSON Response) 200:**

```json
{
  "statusCode": 200,
  "messages": "success",
  "data": {
    "id": "f774034d-d9cc-43a0-97d8-a2520c127f03",
    "amount": 110000,
    "status": "unpaid",
    "link": "ibzfrf4880",
    "expiredAt": 1764582069401,
    "transactions": [
      {
        "id": "23fa41c5-c6ed-45d4-8302-5fac4a165dfa"
      }
    ],
    "customerId": "ae57ce73-89a2-46a7-84d7-93a616ef220e",
    "customer": {
      "id": "ae57ce73-89a2-46a7-84d7-93a616ef220e",
      "email": "azumiikecee@gmail.com",
      "mobile": "08996136751",
      "name": "Azumii"
    },
    "transactionId": "23fa41c5-c6ed-45d4-8302-5fac4a165dfa",
    "paymentUrl": "https://andiak.myr.id/invoices/ibzfrf4880",
    "paymentLinkId": "f774034d-d9cc-43a0-97d8-a2520c127f03"
  }
}
```

**Struktur Respons Sukses (Root):**

| Nama Field   | Tipe      | Deskripsi                                  |
| :----------- | :-------- | :----------------------------------------- |
| `statusCode` | `integer` | Kode status dari API.                      |
| `messages`   | `string`  | Pesan status yang menjelaskan kode status. |
| `data`       | `object`  | Detail invoice yang ditampilkan.           |

**Struktur Objek Data dalam `data`:**

| Nama Field      | Tipe      | Deskripsi                                                       |
| :-------------- | :-------- | :-------------------------------------------------------------- |
| `id`            | `string`  | ID unik invoice.                                                |
| `amount`        | `integer` | Harga atau nilai nominal invoice.                               |
| `status`        | `string`  | Status produk.                                                  |
| `link`          | `string`  | Slug/URL pendek produk.                                         |
| `expiredAt`     | `integer` | Waktu kadaluarsa invoice dalam bentuk timestamp (epoch millis). |
| `transactions`  | `array`   | Daftar transaksi terkait invoice.                               |
| `customerId`    | `string`  | ID pelanggan unik.                                              |
| `customer`      | `object`  | Detail pelanggan yang membayar invoice.                         |
| `transactionId` | `string`  | ID transaksi utama untuk invoice ini.                           |
| `paymentUrl`    | `string`  | URL untuk halaman pembayaran invoice.                           |
| `paymentLinkId` | `string`  | ID unik tautan pembayaran (biasanya sama dengan ID invoice).    |

**Struktur Objek Transaksi dalam `transactions`:**

| Nama Field | Tipe     | Deskripsi          |
| :--------- | :------- | :----------------- |
| `id`       | `string` | ID transaksi unik. |

**Struktur Objek Pelanggan dalam `customer`:**

| Nama Field | Tipe     | Deskripsi                        |
| :--------- | :------- | :------------------------------- |
| `id`       | `string` | ID pelanggan unik.               |
| `email`    | `string` | Alamat email pelanggan.          |
| `mobile`   | `string` | Nomor telepon seluler pelanggan. |
| `name`     | `string` | Nama pelanggan.                  |

---

### 4. Edit Invoice

Endpoint ini digunakan untuk mengedit invoice yang telah dibuat.

- **Method:** `POST`
- **Endpoint URL:**
  - **Produksi:** `https://api.mayar.id/hl/v1/invoice/edit`
  - **Sandbox:** `https://api.mayar.club/hl/v1/invoice/edit`

**Parameter Body:**

| Nama Parameter        | Tipe      | Wajib/Opsional | Deskripsi                                                                                                                                                      |
| :-------------------- | :-------- | :------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                  | `string`  | Wajib          | ID unik invoice yang akan diedit. Dapat ditemukan di URL halaman detail invoice jika diakses melalui dashboard. Contoh: `f774034d-d9cc-43a0-97d8-a2520c127f03` |
| `redirectUrl`         | `string`  | Opsional       | URL tujuan pengalihan pelanggan setelah transaksi berhasil atau selesai.                                                                                       |
| `description`         | `string`  | Opsional       | Deskripsi umum transaksi atau pesanan.                                                                                                                         |
| `items`               | `array`   | Opsional       | Daftar item (produk/layanan) yang dibeli.                                                                                                                      |
| `items[].quantity`    | `integer` | Wajib          | Jumlah item yang dipesan.                                                                                                                                      |
| `items[].rate`        | `integer` | Wajib          | Harga per unit barang.                                                                                                                                         |
| `items[].description` | `string`  | Wajib          | Deskripsi item.                                                                                                                                                |

**Parameter Header:**

| Nama Header     | Tipe     | Deskripsi                             |
| :-------------- | :------- | :------------------------------------ |
| `Authorization` | `string` | Token API Anda dengan skema `Bearer`. |

**Contoh Permintaan (JSON Request):**

```bash
curl --request POST 'https://api.mayar.id/hl/v1/invoice/edit' \
--header 'Authorization: Bearer Paste-Your-API-Key-Here' \
--data-raw '{
  "id": "f774034d-d9cc-43a0-97d8-a2520c127f03",
  "redirectUrl": "https://web.mayar.id",
  "description": "Berubah Jadi Invoice Yang Sudah Diedit",
  "items":[
    {
      "quantity": 2,
      "rate": 55000,
      "description": "Berubah Jadi Invoice Yang Sudah Diedit"
    }
  ]
}'
```

**Contoh Respons (JSON Response) 200:**

```json
{
  "statusCode": 200,
  "messages": "success",
  "data": {
    "id": "f774034d-d9cc-43a0-97d8-a2520c127f03",
    "link": "https://andiak.myr.id/invoices/ibzfrf4880"
  }
}
```

**Struktur Respons Sukses (Root):**

| Nama Field   | Tipe      | Deskripsi                                      |
| :----------- | :-------- | :--------------------------------------------- |
| `statusCode` | `integer` | Kode status dari API.                          |
| `messages`   | `string`  | Pesan status yang menjelaskan kode status.     |
| `data`       | `object`  | Data utama yang dikembalikan (detail invoice). |

**Struktur Objek Data dalam `data`:**

| Nama Field | Tipe     | Deskripsi                                                    |
| :--------- | :------- | :----------------------------------------------------------- |
| `id`       | `string` | ID unik invoice.                                             |
| `link`     | `string` | URL yang dapat diakses pengguna/klien untuk membuka invoice. |

---

### 5. Buka Kembali Invoice

Endpoint ini digunakan untuk mengubah status invoice dari `closed` menjadi `open`.

- **Method:** `GET`
- **Endpoint URL:**
  - **Produksi:** `https://api.mayar.id/hl/v1/invoice/open/{id}`
  - **Sandbox:** `https://api.mayar.club/hl/v1/invoice/open/{id}`

**Parameter Path:**

| Nama Parameter | Tipe     | Wajib/Opsional | Deskripsi                                                                                                                                                              |
| :------------- | :------- | :------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`           | `string` | Wajib          | ID unik invoice yang akan dibuka kembali. Dapat ditemukan di URL halaman detail invoice jika diakses melalui dashboard. Contoh: `f774034d-d9cc-43a0-97d8-a2520c127f03` |

**Parameter Header:**

| Nama Header     | Tipe     | Deskripsi                             |
| :-------------- | :------- | :------------------------------------ |
| `Authorization` | `string` | Token API Anda dengan skema `Bearer`. |

**Contoh Permintaan (JSON Request):**

```bash
curl --request GET 'https://api.mayar.id/hl/v1/invoice/open/f774034d-d9cc-43a0-97d8-a2520c127f03' \
--header 'Authorization: Bearer Paste-Your-API-Key-Here' \
--data ''
```

**Contoh Respons (JSON Response) Sukses:**

```json
{
  "statusCode": 200,
  "messages": "success"
}
```

**Contoh Respons (JSON Response) Gagal:**

```json
{
  "statusCode": 200,
  "messages": "failed"
}
```

**Struktur Respons Sukses (Root):**

| Nama Field   | Tipe      | Deskripsi                                  |
| :----------- | :-------- | :----------------------------------------- |
| `statusCode` | `integer` | Kode status dari API.                      |
| `messages`   | `string`  | Pesan status yang menjelaskan kode status. |

---

## Permintaan Pembayaran

Kategori ini menyediakan endpoint untuk mengelola permintaan pembayaran tunggal, termasuk membuat, melihat, mengedit, dan mengubah statusnya.

### 1. Buat Permintaan Pembayaran Tunggal

Endpoint ini digunakan untuk membuat permintaan pembayaran tunggal.

- **Method:** `POST`
- **Endpoint URL:**
  - **Produksi:** `https://api.mayar.id/hl/v1/payment/create`
  - **Sandbox:** `https://api.mayar.club/hl/v1/payment/create`

**Parameter Body:**

| Nama Parameter | Tipe      | Wajib/Opsional | Deskripsi                                                                                                                                                               |
| :------------- | :-------- | :------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`         | `string`  | Wajib          | Nama pelanggan.                                                                                                                                                         |
| `email`        | `string`  | Wajib          | Alamat email pelanggan yang digunakan untuk mengirim bukti pembayaran atau pengingat pembayaran.                                                                        |
| `amount`       | `integer` | Wajib          | Jumlah nominal pembayaran.                                                                                                                                              |
| `mobile`       | `string`  | Wajib          | Nomor telepon seluler pelanggan.                                                                                                                                        |
| `redirectUrl`  | `string`  | Opsional       | URL tujuan pengalihan pelanggan setelah transaksi berhasil atau selesai.                                                                                                |
| `description`  | `string`  | Opsional       | Deskripsi umum transaksi atau pesanan.                                                                                                                                  |
| `expiredAt`    | `string`  | Opsional       | Tanggal dan waktu kadaluarsa transaksi. Setelah waktu ini, tautan pembayaran atau pesanan tidak lagi berlaku. Format ISO 8601 (UTC). Contoh: `2025-12-29T09:41:09.401Z` |

**Parameter Header:**

| Nama Header     | Tipe     | Deskripsi                             |
| :-------------- | :------- | :------------------------------------ |
| `Authorization` | `string` | Token API Anda dengan skema `Bearer`. |

**Contoh Permintaan (JSON Request):**

```bash
curl --request POST 'https://api.mayar.id/hl/v1/payment/create' \
--header 'Authorization: Bearer Paste-Your-API-Key-Here' \
--data-raw '{
  "name": "Azumii",
  "email": "azumiikecee@gmail.com",
  "amount": 170000,
  "mobile": "08996136751",
  "redirectUrl": "https://web.mayar.id/",
  "description": "Testing ReqPayment",
  "expiredAt": "2025-12-29T09:41:09.401Z"
}'
```

**Contoh Respons (JSON Response) 200:**

```json
{
  "statusCode": 200,
  "messages": "success",
  "data": {
    "id": "e890d24a-cfc0-4915-83d2-3166b9ffba9e",
    "transaction_id": "040d5adb-1496-45de-8435-5cab16526a8c",
    "transactionId": "040d5adb-1496-45de-8435-5cab16526a8c",
    "link": "https://andiak.myr.id/invoices/ohsjrd3wko"
  }
}
```

**Struktur Respons Sukses (Root):**

| Nama Field   | Tipe      | Deskripsi                                                    |
| :----------- | :-------- | :----------------------------------------------------------- |
| `statusCode` | `integer` | Kode status dari API.                                        |
| `messages`   | `string`  | Pesan status yang menjelaskan kode status.                   |
| `data`       | `object`  | Data utama yang dikembalikan (detail permintaan pembayaran). |

**Struktur Objek Data dalam `data`:**

| Nama Field       | Tipe     | Deskripsi                                                                     |
| :--------------- | :------- | :---------------------------------------------------------------------------- |
| `id`             | `string` | ID unik permintaan pembayaran.                                                |
| `transaction_id` | `string` | ID transaksi unik yang terkait dengan permintaan pembayaran ini. (deprecated) |
| `transactionId`  | `string` | ID transaksi unik yang terkait dengan permintaan pembayaran ini.              |
| `link`           | `string` | URL yang dapat diakses pengguna/klien untuk membuka permintaan pembayaran.    |

---

### 2. Dapatkan Daftar Permintaan Pembayaran Tunggal

Endpoint ini digunakan untuk melihat detail dan daftar permintaan pembayaran tunggal yang telah dibuat.

- **Method:** `GET`
- **Endpoint URL:**
  - **Produksi:** `https://api.mayar.id/hl/v1/payment`
  - **Sandbox:** `https://api.mayar.club/hl/v1/payment`

**Parameter Header:**

| Nama Header     | Tipe     | Deskripsi                             |
| :-------------- | :------- | :------------------------------------ |
| `Authorization` | `string` | Token API Anda dengan skema `Bearer`. |

**Contoh Permintaan (JSON Request):**

```bash
curl --request GET 'https://api.mayar.id/hl/v1/payment' \
--header 'Authorization: Bearer Paste-Your-API-Key-Here' \
--data ''
```

**Contoh Respons (JSON Response) 200:**

```json
{
  "statusCode": 200,
  "messages": "success",
  "hasMore": true,
  "pageCount": 3,
  "pageSize": 10,
  "page": 1,
  "data": [
    {
      "id": "07e1d023-3bc4-46cd-9a30-2102cd0770f4",
      "amount": 100000,
      "category": null,
      "createdAt": 1753681216049,
      "description": "Asasasasasasasasas\n",
      "link": "xnxivrq8ple",
      "type": "payment_request",
      "status": "unpaid",
      "name": "Penagihan",
      "limit": null,
      "redirectUrl": null,
      "installmentId": null,
      "event": null,
      "order": null,
      "coverImageId": null,
      "multipleImageId": null,
      "coverImage": null,
      "multipleImage": null
    }
  ]
}
```

**Struktur Respons Sukses (Root):**

| Nama Field   | Tipe      | Deskripsi                                                           |
| :----------- | :-------- | :------------------------------------------------------------------ |
| `statusCode` | `integer` | Kode status dari API.                                               |
| `messages`   | `string`  | Pesan status yang menjelaskan kode status.                          |
| `hasMore`    | `boolean` | Informasi apakah ada data tambahan yang dapat diambil (true/false). |
| `pageCount`  | `integer` | Total jumlah halaman data.                                          |
| `pageSize`   | `integer` | Jumlah item per halaman.                                            |
| `page`       | `integer` | Halaman yang sedang ditampilkan.                                    |
| `data`       | `array`   | Daftar produk yang ditampilkan.                                     |

**Struktur Objek Data dalam `data`:**

| Nama Field        | Tipe      | Deskripsi                                               |
| :---------------- | :-------- | :------------------------------------------------------ |
| `id`              | `string`  | ID unik permintaan pembayaran.                          |
| `amount`          | `integer` | Harga atau nilai nominal produk.                        |
| `category`        | `string`  | Kategori produk, bisa `null` jika tidak ada kategori.   |
| `createdAt`       | `integer` | Waktu pembuatan produk dalam format epoch milliseconds. |
| `description`     | `string`  | Deskripsi produk.                                       |
| `link`            | `string`  | Slug/URL pendek produk.                                 |
| `type`            | `string`  | Tipe produk.                                            |
| `status`          | `string`  | Status produk.                                          |
| `name`            | `string`  | Nama produk.                                            |
| `limit`           | `integer` | Batasan jumlah tertentu, bisa `null`.                   |
| `redirectUrl`     | `string`  | URL tujuan pengalihan, bisa `null`.                     |
| `installmentId`   | `string`  | ID cicilan jika produk mendukung cicilan, bisa `null`.  |
| `event`           | `object`  | Data event terkait, bisa `null`.                        |
| `order`           | `object`  | Data order terkait, bisa `null`.                        |
| `coverImageId`    | `string`  | ID gambar sampul, bisa `null`.                          |
| `multipleImageId` | `string`  | ID untuk grup beberapa gambar, bisa `null`.             |
| `coverImage`      | `object`  | Data gambar sampul, bisa `null`.                        |
| `multipleImage`   | `array`   | Daftar gambar tambahan untuk produk.                    |

---

### 3. Dapatkan Detail Permintaan Pembayaran Tunggal

Endpoint ini digunakan untuk melihat detail permintaan pembayaran tunggal yang telah dibuat.

- **Method:** `GET`
- **Endpoint URL:**
  - **Produksi:** `https://api.mayar.id/hl/v1/payment/{id}`
  - **Sandbox:** `https://api.mayar.club/hl/v1/payment/{id}`

**Parameter Path:**

| Nama Parameter | Tipe     | Wajib/Opsional | Deskripsi                                                                                                                                                                         |
| :------------- | :------- | :------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`           | `string` | Wajib          | ID unik permintaan pembayaran tunggal. Dapat ditemukan di URL halaman detail permintaan pembayaran jika diakses melalui dashboard. Contoh: `e890d24a-cfc0-4915-83d2-3166b9ffba9e` |

**Parameter Header:**

| Nama Header     | Tipe     | Deskripsi                             |
| :-------------- | :------- | :------------------------------------ |
| `Authorization` | `string` | Token API Anda dengan skema `Bearer`. |

**Contoh Permintaan (JSON Request):**

```bash
curl --request GET 'https://api.mayar.id/hl/v1/payment/e890d24a-cfc0-4915-83d2-3166b9ffba9e' \
--header 'Authorization: Bearer Paste-Your-API-Key-Here' \
--data ''
```

**Contoh Respons (JSON Response) 200:**

```json
{
  "statusCode": 200,
  "messages": "success",
  "data": {
    "id": "e890d24a-cfc0-4915-83d2-3166b9ffba9e",
    "link": "ohsjrd3wko",
    "name": "Azumii",
    "category": null,
    "limit": null,
    "type": "payment_request",
    "userId": "348e083d-315a-4e5c-96b1-5a2a98c48413",
    "event": null,
    "order": null,
    "qty": null,
    "amount": 100000,
    "status": "unpaid",
    "description": "Ubah ReqPayment",
    "coverImageId": null,
    "multipleImageId": null,
    "coverImage": null,
    "multipleImage": null
  }
}
```

**Struktur Respons Sukses (Root):**

| Nama Field   | Tipe      | Deskripsi                                        |
| :----------- | :-------- | :----------------------------------------------- |
| `statusCode` | `integer` | Kode status dari API.                            |
| `messages`   | `string`  | Pesan status yang menjelaskan kode status.       |
| `data`       | `object`  | Detail produk permintaan pembayaran ditampilkan. |

**Struktur Objek Data dalam `data`:**

| Nama Field        | Tipe      | Deskripsi                                                    |
| :---------------- | :-------- | :----------------------------------------------------------- |
| `id`              | `string`  | ID unik permintaan pembayaran.                               |
| `link`            | `string`  | Slug/URL pendek produk.                                      |
| `name`            | `string`  | Nama produk.                                                 |
| `category`        | `string`  | Kategori produk, bisa `null` jika tidak ada kategori.        |
| `limit`           | `integer` | Batasan jumlah tertentu, bisa `null`.                        |
| `type`            | `string`  | Tipe produk.                                                 |
| `userId`          | `string`  | ID unik pengguna yang membuat permintaan.                    |
| `event`           | `object`  | Data event terkait, bisa `null`.                             |
| `order`           | `object`  | Data order terkait, bisa `null`.                             |
| `qty`             | `integer` | Kuantitas (jika permintaan terkait barang/layanan spesifik). |
| `amount`          | `integer` | Harga atau nilai nominal produk.                             |
| `status`          | `string`  | Status produk.                                               |
| `description`     | `string`  | Deskripsi produk.                                            |
| `coverImageId`    | `string`  | ID gambar sampul, bisa `null`.                               |
| `multipleImageId` | `string`  | ID untuk grup beberapa gambar, bisa `null`.                  |
| `coverImage`      | `object`  | Data gambar sampul, bisa `null`.                             |
| `multipleImage`   | `array`   | Daftar gambar tambahan untuk produk.                         |

---

### 4. Edit Permintaan Pembayaran Tunggal

Endpoint ini digunakan untuk mengedit permintaan pembayaran yang telah dibuat.

- **Method:** `POST`
- **Endpoint URL:**
  - **Produksi:** `https://api.mayar.id/hl/v1/payment/edit`
  - **Sandbox:** `https://api.mayar.club/hl/v1/payment/edit`

**Parameter Body:**

| Nama Parameter | Tipe      | Wajib/Opsional | Deskripsi                                                                                                                                                                         |
| :------------- | :-------- | :------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`           | `string`  | Wajib          | ID unik permintaan pembayaran tunggal. Dapat ditemukan di URL halaman detail permintaan pembayaran jika diakses melalui dashboard. Contoh: `e890d24a-cfc0-4915-83d2-3166b9ffba9e` |
| `name`         | `string`  | Opsional       | Nama pelanggan.                                                                                                                                                                   |
| `email`        | `string`  | Opsional       | Alamat email pelanggan yang digunakan untuk mengirim bukti pembayaran atau pengingat pembayaran.                                                                                  |
| `amount`       | `integer` | Opsional       | Jumlah nominal pembayaran.                                                                                                                                                        |
| `mobile`       | `string`  | Opsional       | Nomor telepon seluler pelanggan.                                                                                                                                                  |
| `redirectUrl`  | `string`  | Opsional       | URL tujuan pengalihan pelanggan setelah transaksi berhasil atau selesai.                                                                                                          |
| `description`  | `string`  | Opsional       | Deskripsi umum transaksi atau pesanan.                                                                                                                                            |
| `expiredAt`    | `string`  | Opsional       | Tanggal dan waktu kadaluarsa transaksi. Setelah waktu ini, tautan pembayaran atau pesanan tidak lagi berlaku. Format ISO 8601 (UTC). Contoh: `2025-12-29T09:41:09.401Z`           |

**Parameter Header:**

| Nama Header     | Tipe     | Deskripsi                             |
| :-------------- | :------- | :------------------------------------ |
| `Authorization` | `string` | Token API Anda dengan skema `Bearer`. |

**Contoh Permintaan (JSON Request):**

```bash
curl --request POST 'https://api.mayar.id/hl/v1/payment/edit' \
--header 'Authorization: Bearer Paste-Your-API-Key-Here' \
--data-raw '{
  "name": "Azumii",
  "email": "azumiikecee@gmail.com",
  "amount": 100000,
  "mobile": "089961367511",
  "redirectUrl": "https://web.mayar.id.",
  "description": "Ubah ReqPayment",
  "expiredAt": "2025-12-29T09:41:09.401Z",
  "id": "e890d24a-cfc0-4915-83d2-3166b9ffba9e"
}'
```

**Contoh Respons (JSON Response) 200:**

```json
{
  "statusCode": 200,
  "messages": "success",
  "data": {
    "id": "e890d24a-cfc0-4915-83d2-3166b9ffba9e",
    "link": "https://testingmayar.myr.id/invoices/ohsjrd3wko"
  }
}
```

**Struktur Respons Sukses (Root):**

| Nama Field   | Tipe      | Deskripsi                                                    |
| :----------- | :-------- | :----------------------------------------------------------- |
| `statusCode` | `integer` | Kode status dari API.                                        |
| `messages`   | `string`  | Pesan status yang menjelaskan kode status.                   |
| `data`       | `object`  | Data utama yang dikembalikan (detail permintaan pembayaran). |

**Struktur Objek Data dalam `data`:**

| Nama Field | Tipe     | Deskripsi                                                                  |
| :--------- | :------- | :------------------------------------------------------------------------- |
| `id`       | `string` | ID unik permintaan pembayaran.                                             |
| `link`     | `string` | URL yang dapat diakses pengguna/klien untuk membuka permintaan pembayaran. |

---

### 5. Tutup Permintaan Pembayaran Tunggal

Endpoint ini digunakan untuk mengubah status permintaan pembayaran tunggal menjadi `closed`.

- **Method:** `GET`
- **Endpoint URL:**
  - **Produksi:** `https://api.mayar.id/hl/v1/payment/close/{id}`
  - **Sandbox:** `https://api.mayar.club/hl/v1/payment/close/{id}`

**Parameter Path:**

| Nama Parameter | Tipe     | Wajib/Opsional | Deskripsi                      |
| :------------- | :------- | :------------- | :----------------------------- |
| `id`           | `string` | Wajib          | ID unik permintaan pembayaran. |

**Parameter Header:**

| Nama Header     | Tipe     | Deskripsi                             |
| :-------------- | :------- | :------------------------------------ |
| `Authorization` | `string` | Token API Anda dengan skema `Bearer`. |

**Contoh Permintaan (JSON Request):**

```bash
curl --request GET 'https://api.mayar.id/hl/v1/payment/close/e890d24a-cfc0-4915-83d2-3166b9ffba9e' \
--header 'Authorization: Bearer Paste-Your-API-Key-Here' \
--data ''
```

**Contoh Respons (JSON Response) Sukses:**

```json
{
  "statusCode": 200,
  "messages": "success"
}
```

**Contoh Respons (JSON Response) Gagal:**

```json
{
  "statusCode": 200,
  "messages": "failed"
}
```

**Struktur Respons Sukses:**

| Nama Field   | Tipe      | Deskripsi                                  |
| :----------- | :-------- | :----------------------------------------- |
| `statusCode` | `integer` | Kode status dari API.                      |
| `messages`   | `string`  | Pesan status yang menjelaskan kode status. |

---

### 6. Buka Kembali Permintaan Pembayaran Tunggal

Endpoint ini digunakan untuk mengubah status permintaan pembayaran tunggal dari `closed` menjadi `open`.

- **Method:** `GET`
- **Endpoint URL:**
  - **Produksi:** `https://api.mayar.id/hl/v1/payment/open/{id}`
  - **Sandbox:** `https://api.mayar.club/hl/v1/payment/open/{id}`

**Parameter Path:**

| Nama Parameter | Tipe     | Wajib/Opsional | Deskripsi                      |
| :------------- | :------- | :------------- | :----------------------------- |
| `id`           | `string` | Wajib          | ID unik permintaan pembayaran. |

**Parameter Header:**

| Nama Header     | Tipe     | Deskripsi                             |
| :-------------- | :------- | :------------------------------------ |
| `Authorization` | `string` | Token API Anda dengan skema `Bearer`. |

**Contoh Permintaan (JSON Request):**

```bash
curl --request GET 'https://api.mayar.id/hl/v1/payment/open/e890d24a-cfc0-4915-83d2-3166b9ffba9e' \
--header 'Authorization: Bearer Paste-Your-API-Key-Here'
```

**Contoh Respons (JSON Response) Sukses:**

```json
{
  "statusCode": 200,
  "messages": "success"
}
```

**Contoh Respons (JSON Response) Gagal:**

```json
{
  "statusCode": 200,
  "messages": "failed"
}
```

**Struktur Respons Sukses:**

| Nama Field   | Tipe      | Deskripsi                                  |
| :----------- | :-------- | :----------------------------------------- |
| `statusCode` | `integer` | Kode status dari API.                      |
| `messages`   | `string`  | Pesan status yang menjelaskan kode status. |

---

## Cicilan

Kategori ini menyediakan endpoint untuk mengelola cicilan, termasuk membuat dan melihat detail cicilan.

### 1. Buat Cicilan

Endpoint ini digunakan untuk membuat cicilan.

- **Method:** `POST`
- **Endpoint URL:**
  - **Produksi:** `https://api.mayar.id/hl/v1/installment/create`
  - **Sandbox:** `https://api.mayar.club/hl/v1/installment/create`

**Parameter Body:**

| Nama Parameter            | Tipe      | Wajib/Opsional | Deskripsi                                                                                        |
| :------------------------ | :-------- | :------------- | :----------------------------------------------------------------------------------------------- |
| `email`                   | `string`  | Wajib          | Alamat email pelanggan yang digunakan untuk mengirim bukti pembayaran atau pengingat pembayaran. |
| `mobile`                  | `string`  | Wajib          | Nomor telepon seluler pelanggan.                                                                 |
| `name`                    | `string`  | Wajib          | Nama pelanggan.                                                                                  |
| `amount`                  | `integer` | Wajib          | Jumlah nominal pembayaran.                                                                       |
| `installment`             | `object`  | Wajib          | Detail cicilan.                                                                                  |
| `installment.description` | `string`  | Wajib          | Deskripsi umum transaksi atau pesanan.                                                           |
| `installment.interest`    | `integer` | Wajib          | Persentase bunga cicilan.                                                                        |
| `installment.tenure`      | `integer` | Wajib          | Periode tenor cicilan (dalam bulan).                                                             |
| `installment.dueDate`     | `integer` | Wajib          | Tanggal jatuh tempo setiap bulan (contoh: `11` untuk tanggal 11 setiap bulan).                   |

**Parameter Header:**

| Nama Header     | Tipe     | Deskripsi                             |
| :-------------- | :------- | :------------------------------------ |
| `Authorization` | `string` | Token API Anda dengan skema `Bearer`. |

**Contoh Permintaan (JSON Request):**

```bash
curl --request POST 'https://api.mayar.id/hl/v1/installment/create' \
--header 'Authorization: Bearer Paste-Your-API-Key-Here' \
--data-raw '{
  "email": "azumiikecee@gmail.com",
  "mobile": "089961367511",
  "name": "Azumii",
  "amount": 1500000,
  "installment": {
    "description": "Cicil Produk Kelas Online 3 Bulan",
    "interest": 0,
    "tenure": 3,
    "dueDate": 11
  }
}'
```

**Contoh Respons (JSON Response) 200:**

```json
{
  "statusCode": 200,
  "messages": "Success",
  "data": {
    "id": "ba82c2dd-06c1-4b6c-bc59-a9c00801c842",
    "createdAt": 1755631209521,
    "dueDate": 11,
    "interest": 0,
    "interestType": "FLAT",
    "period": "MONTHLY",
    "tenure": 3,
    "invoices": [
      {
        "id": "9fe1b9c4-b5d5-4d45-bf1a-5c4849631725",
        "amount": 500000,
        "updatedAt": 1755631210118,
        "category": null,
        "status": "unpaid",
        "index": 1,
        "link": "mkcn4u72ki",
        "description": "Cicil Produk Kelas Online 3 Bulan",
        "interestAmount": 0,
        "remainingAmount": 1000000,
        "customerId": "62d1a396-07d8-4d93-a14c-9ec801f3af20",
        "customer": {
          "id": "62d1a396-07d8-4d93-a14c-9ec801f3af20",
          "email": "azumiikecee@gmail.com",
          "mobile": "089961367511",
          "name": "Azumii"
        }
      }
    ]
  }
}
```

**Struktur Respons Sukses (Root Objek):**

| Nama Field   | Tipe      | Deskripsi                                  |
| :----------- | :-------- | :----------------------------------------- |
| `statusCode` | `integer` | Kode status dari API.                      |
| `messages`   | `string`  | Pesan status yang menjelaskan kode status. |
| `data`       | `object`  | Data respons utama.                        |

**Struktur Objek Data dalam `data`:**

| Nama Field     | Tipe      | Deskripsi                                    |
| :------------- | :-------- | :------------------------------------------- |
| `id`           | `string`  | ID utama.                                    |
| `createdAt`    | `integer` | Waktu pembuatan (timestamp dalam milidetik). |
| `dueDate`      | `integer` | Nilai tanggal jatuh tempo (contoh: `11`).    |
| `interest`     | `integer` | Nilai bunga.                                 |
| `interestType` | `string`  | Tipe bunga (contoh: `"FLAT"`).               |
| `period`       | `string`  | Periode cicilan (contoh: `"MONTHLY"`).       |
| `tenure`       | `integer` | Durasi cicilan (dalam bulan).                |
| `invoices`     | `array`   | Daftar invoice yang dihasilkan dari cicilan. |

**Struktur Objek Invoice dalam `invoices`:**

| Nama Field        | Tipe      | Deskripsi                                              |
| :---------------- | :-------- | :----------------------------------------------------- |
| `id`              | `string`  | ID invoice cicilan yang dibuat.                        |
| `amount`          | `integer` | Jumlah invoice.                                        |
| `updatedAt`       | `integer` | Waktu terakhir diperbarui (timestamp dalam milidetik). |
| `category`        | `string`  | Kategori invoice.                                      |
| `status`          | `string`  | Status pembayaran (contoh: `"unpaid"`).                |
| `index`           | `integer` | Nomor urut invoice.                                    |
| `link`            | `string`  | Tautan unik invoice.                                   |
| `description`     | `string`  | Deskripsi invoice.                                     |
| `interestAmount`  | `integer` | Jumlah bunga untuk invoice.                            |
| `remainingAmount` | `integer` | Sisa saldo.                                            |
| `customerId`      | `string`  | ID pelanggan.                                          |
| `customer`        | `object`  | Detail pelanggan.                                      |

**Struktur Objek Pelanggan dalam `customer` (nested within `invoices`):**

| Nama Field | Tipe     | Deskripsi                |
| :--------- | :------- | :----------------------- |
| `id`       | `string` | ID pelanggan.            |
| `email`    | `string` | Alamat email pelanggan.  |
| `mobile`   | `string` | Nomor telepon pelanggan. |
| `name`     | `string` | Nama pelanggan.          |

---

### 2. Dapatkan Detail Cicilan

Endpoint ini digunakan untuk melihat detail dan status cicilan yang telah dibuat.

- **Method:** `GET`
- **Endpoint URL:**
  - **Produksi:** `https://api.mayar.id/hl/v1/installment/{id}`
  - **Sandbox:** `https://api.mayar.club/hl/v1/installment/{id}`

**Parameter Path:**

| Nama Parameter | Tipe     | Wajib/Opsional | Deskripsi                                                                                                                                     |
| :------------- | :------- | :------------- | :-------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`           | `string` | Wajib          | ID unik cicilan. Dapat ditemukan di URL halaman detail cicilan jika diakses melalui dashboard. Contoh: `ba82c2dd-06c1-4b6c-bc59-a9c00801c842` |

**Parameter Header:**

| Nama Header     | Tipe     | Deskripsi                             |
| :-------------- | :------- | :------------------------------------ |
| `Authorization` | `string` | Token API Anda dengan skema `Bearer`. |

**Contoh Permintaan (JSON Request):**

```bash
curl --request GET 'https://api.mayar.id/hl/v1/installment/ba82c2dd-06c1-4b6c-bc59-a9c00801c842' \
--header 'Authorization: Bearer Paste-Your-API-Key-Here' \
--data ''
```

**Contoh Respons (JSON Response) 200:**

```json
{
  "statusCode": 200,
  "messages": "Success",
  "data": {
    "id": "ba82c2dd-06c1-4b6c-bc59-a9c00801c842",
    "createdAt": 1755631209521,
    "period": "MONTHLY",
    "tenure": 3,
    "dueDate": 11,
    "interest": 0,
    "interestType": "FLAT",
    "paymentLinkId": "8f722421-e8fd-4d05-ae0c-5f4a224b7923",
    "updatedAt": 1755631209521,
    "userId": "348e083d-315a-4e5c-96b1-5a2a98c48413",
    "paymentLink": {
      "id": "8f722421-e8fd-4d05-ae0c-5f4a224b7923",
      "name": "Azumii",
      "amount": 1500000,
      "description": "Cicil Produk Kelas Online 3 Bulan",
      "customerId": "62d1a396-07d8-4d93-a14c-9ec801f3af20"
    },
    "invoices": [
      {
        "id": "9fe1b9c4-b5d5-4d45-bf1a-5c4849631725",
        "expiredAt": 1757523600000,
        "amount": 500000,
        "category": null,
        "status": "unpaid",
        "index": 1,
        "link": "mkcn4u72ki",
        "description": "Cicil Produk Kelas Online 3 Bulan",
        "interestAmount": 0,
        "remainingAmount": 1000000
      }
    ]
  }
}
```

**Struktur Respons Sukses (Root Objek):**

| Nama Field   | Tipe      | Deskripsi                                  |
| :----------- | :-------- | :----------------------------------------- |
| `statusCode` | `integer` | Kode status dari API.                      |
| `messages`   | `string`  | Pesan status yang menjelaskan kode status. |
| `data`       | `object`  | Data respons utama.                        |

**Struktur Objek Data dalam `data`:**

| Nama Field      | Tipe      | Deskripsi                                              |
| :-------------- | :-------- | :----------------------------------------------------- |
| `id`            | `string`  | ID utama (UUID).                                       |
| `createdAt`     | `integer` | Waktu pembuatan (timestamp dalam milidetik).           |
| `period`        | `string`  | Periode cicilan (contoh: `"MONTHLY"`).                 |
| `tenure`        | `integer` | Durasi cicilan (dalam bulan).                          |
| `dueDate`       | `integer` | Nilai tanggal jatuh tempo (contoh: `11`).              |
| `interest`      | `integer` | Nilai bunga.                                           |
| `interestType`  | `string`  | Tipe bunga (contoh: `"FLAT"`).                         |
| `paymentLinkId` | `string`  | ID Tautan Pembayaran yang terkait.                     |
| `updatedAt`     | `integer` | Waktu terakhir diperbarui (timestamp dalam milidetik). |
| `userId`        | `string`  | ID pengguna.                                           |
| `paymentLink`   | `object`  | Detail tautan pembayaran.                              |
| `invoices`      | `array`   | Daftar invoice yang dihasilkan dari cicilan.           |

**Struktur Objek `paymentLink`:**

| Nama Field    | Tipe      | Deskripsi                               |
| :------------ | :-------- | :-------------------------------------- |
| `id`          | `string`  | ID tautan pembayaran.                   |
| `name`        | `string`  | Nama pelanggan untuk tautan pembayaran. |
| `amount`      | `integer` | Total jumlah pembayaran.                |
| `description` | `string`  | Deskripsi pembayaran.                   |
| `customerId`  | `string`  | ID pelanggan.                           |

**Struktur Objek Invoice dalam `invoices`:**

| Nama Field        | Tipe      | Deskripsi                               |
| :---------------- | :-------- | :-------------------------------------- |
| `id`              | `string`  | ID invoice.                             |
| `expiredAt`       | `integer` | Waktu kadaluarsa cicilan yang dibuat.   |
| `amount`          | `integer` | Jumlah invoice.                         |
| `category`        | `string`  | Kategori invoice.                       |
| `status`          | `string`  | Status pembayaran (contoh: `"unpaid"`). |
| `index`           | `integer` | Nomor urut invoice.                     |
| `link`            | `string`  | Tautan unik invoice.                    |
| `description`     | `string`  | Deskripsi invoice.                      |
| `interestAmount`  | `integer` | Jumlah bunga untuk invoice.             |
| `remainingAmount` | `integer` | Sisa saldo untuk invoice ini.           |

---

## Pelanggan

Kategori ini menyediakan endpoint untuk mengelola data pelanggan, termasuk membuat dan mendapatkan daftar pelanggan.

### 1. Buat Pelanggan

Endpoint ini digunakan untuk membuat data pelanggan.

- **Method:** `POST`
- **Endpoint URL:**
  - **Produksi:** `https://api.mayar.id/hl/v1/customer/create`
  - **Sandbox:** `https://api.mayar.club/hl/v1/customer/create`

**Parameter Body:**

| Nama Parameter | Tipe     | Wajib/Opsional | Deskripsi                        |
| :------------- | :------- | :------------- | :------------------------------- |
| `name`         | `string` | Wajib          | Nama pelanggan.                  |
| `email`        | `string` | Wajib          | Alamat email pelanggan.          |
| `mobile`       | `string` | Wajib          | Nomor telepon seluler pelanggan. |

**Parameter Header:**

| Nama Header     | Tipe     | Deskripsi                             |
| :-------------- | :------- | :------------------------------------ |
| `Authorization` | `string` | Token API Anda dengan skema `Bearer`. |

**Contoh Permintaan (JSON Request):**

```bash
curl --request POST 'https://api.mayar.id/hl/v1/customer/create' \
--header 'Authorization: Bearer Paste-Your-API-Key-Here' \
--data-raw '{
  "name": "Raihan Nur Azmii",
  "email": "mraihanna19@gmail.com",
  "mobile": "089912345678"
}'
```

**Contoh Respons (JSON Response) 200:**

```json
{
  "statusCode": 200,
  "messages": "success",
  "data": {
    "name": "Raihan Nur Azmii",
    "email": "mraihanna19@gmail.com",
    "mobile": "089912345678",
    "userId": "348e083d-315a-4e5c-96b1-5a2a98c48413",
    "customerId": "b0356d4c-516a-403e-abfe-b144da7068b4"
  }
}
```

**Struktur Respons Sukses (Root):**

| Nama Field   | Tipe      | Deskripsi                                                  |
| :----------- | :-------- | :--------------------------------------------------------- |
| `statusCode` | `integer` | Kode status dari API.                                      |
| `messages`   | `string`  | Pesan status yang menjelaskan kode status.                 |
| `data`       | `object`  | Data utama yang dikembalikan (informasi detail pelanggan). |

**Struktur Objek Data dalam `data`:**

| Nama Field   | Tipe     | Deskripsi                                             |
| :----------- | :------- | :---------------------------------------------------- |
| `name`       | `string` | Nama pelanggan.                                       |
| `email`      | `string` | Alamat email pelanggan.                               |
| `mobile`     | `string` | Nomor telepon seluler pelanggan.                      |
| `userId`     | `string` | ID unik untuk pengguna (pemilik akun).                |
| `customerId` | `string` | ID unik untuk pelanggan yang terkait dengan pengguna. |

---

### 2. Dapatkan Daftar Pelanggan

Endpoint ini digunakan untuk mendapatkan detail pelanggan Anda.

- **Method:** `GET`
- **Endpoint URL:**
  - **Produksi:** `https://api.mayar.id/hl/v1/customer`
  - **Sandbox:** `https://api.mayar.club/hl/v1/customer`

**Parameter Query:**

| Nama Parameter | Tipe      | Wajib/Opsional | Deskripsi                                                   |
| :------------- | :-------- | :------------- | :---------------------------------------------------------- |
| `page`         | `integer` | Opsional       | Menentukan halaman yang akan diambil.                       |
| `pageSize`     | `integer` | Opsional       | Menentukan berapa banyak data yang ditampilkan per halaman. |

**Parameter Header:**

| Nama Header     | Tipe     | Deskripsi                             |
| :-------------- | :------- | :------------------------------------ |
| `Authorization` | `string` | Token API Anda dengan skema `Bearer`. |

**Contoh Permintaan (JSON Request):**

```bash
curl --request GET 'https://api.mayar.id/hl/v1/customer?page=1&pageSize=10' \
--header 'Authorization: Bearer Paste-Your-API-Key-Here'
```

**Contoh Respons (JSON Response) 200:**

```json
{
  "statusCode": 200,
  "messages": "success",
  "hasMore": true,
  "pageCount": 98,
  "pageSize": 12,
  "page": 1,
  "totalCustomer": 1176,
  "data": [
    {
      "id": "0072cf8e-a8f1-4ce9-9dcd-3683f085ebf1",
      "createdAt": 1735787039376,
      "email": "ghasyiyahps@gmail.com",
      "mobile": "6281296450946",
      "name": "Kirana",
      "status": "active",
      "updatedAt": 1735787039377,
      "userId": "4dba4996-7d74-483e-99fe-b52c60368cb5"
    }
  ]
}
```

**Struktur Respons Sukses (Root):**

| Nama Field      | Tipe      | Deskripsi                                                           |
| :-------------- | :-------- | :------------------------------------------------------------------ |
| `statusCode`    | `integer` | Kode status dari API.                                               |
| `messages`      | `string`  | Pesan status yang menjelaskan kode status.                          |
| `hasMore`       | `boolean` | Informasi apakah ada data tambahan yang dapat diambil (true/false). |
| `pageCount`     | `integer` | Total jumlah halaman data.                                          |
| `pageSize`      | `integer` | Jumlah item per halaman.                                            |
| `page`          | `integer` | Halaman yang sedang ditampilkan.                                    |
| `totalCustomer` | `integer` | Total jumlah pelanggan.                                             |
| `data`          | `array`   | Daftar produk yang ditampilkan.                                     |

**Struktur Objek Data dalam `data`:**

| Nama Field  | Tipe      | Deskripsi                                       |
| :---------- | :-------- | :---------------------------------------------- |
| `id`        | `string`  | ID pelanggan unik.                              |
| `createdAt` | `integer` | Waktu pembuatan data.                           |
| `email`     | `string`  | Alamat email pelanggan.                         |
| `mobile`    | `string`  | Nomor telepon pelanggan.                        |
| `name`      | `string`  | Nama pelanggan.                                 |
| `status`    | `string`  | Status pelanggan, contoh: "active", "inactive". |
| `updatedAt` | `integer` | Waktu terakhir data diperbarui.                 |
| `userId`    | `string`  | ID pengguna pemilik data/pelanggan ini.         |

---

## Transaksi QR

Kategori ini menyediakan endpoint untuk membuat QR Code dinamis.

### 1. Buat QR Code Dinamis

Endpoint ini digunakan untuk membuat QR Code dinamis.

- **Method:** `POST`
- **Endpoint URL:**
  - **Produksi:** `https://api.mayar.id/hl/v1/qrcode/create`
  - **Sandbox:** `https://api.mayar.club/hl/v1/qrcode/create`

**Parameter Body:**

| Nama Parameter | Tipe      | Wajib/Opsional | Deskripsi           |
| :------------- | :-------- | :------------- | :------------------ |
| `amount`       | `integer` | Wajib          | Nominal pembayaran. |

**Parameter Header:**

| Nama Header     | Tipe     | Deskripsi                             |
| :-------------- | :------- | :------------------------------------ |
| `Authorization` | `string` | Token API Anda dengan skema `Bearer`. |

**Contoh Permintaan (JSON Request):**

```bash
curl --request POST 'https://api.mayar.id/hl/v1/qrcode/create' \
--header 'Authorization: Bearer Paste-Your-API-Key-Here' \
--data-raw '{
  "amount": 10000
}'
```

**Contoh Respons (JSON Response) 200:**

```json
{
  "statusCode": 200,
  "messages": "Success",
  "data": {
    "url": "https://media.mayar.id/images/resized/480/a30ed45f-976b-490f-b97c-72c90d1e8d9d.png",
    "amount": 10000
  }
}
```

**Struktur Respons Sukses (Root):**

| Nama Field   | Tipe      | Deskripsi                                                |
| :----------- | :-------- | :------------------------------------------------------- |
| `statusCode` | `integer` | Kode status dari API.                                    |
| `messages`   | `string`  | Pesan status yang menjelaskan kode status.               |
| `data`       | `object`  | Data utama yang dikembalikan (informasi detail QR Code). |

**Struktur Objek Data dalam `data`:**

| Nama Field | Tipe      | Deskripsi                           |
| :--------- | :-------- | :---------------------------------- |
| `url`      | `string`  | Tautan file (gambar QR disediakan). |
| `amount`   | `integer` | Nominal pembayaran.                 |

---
