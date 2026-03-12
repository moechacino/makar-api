import { db } from "../db";
import { tenants, users } from "../db/schema";
import { eq, and, ne } from "drizzle-orm";
import { env } from "../config/env";
import path from "path";
import bankCodes from "../db/bank_code.json";

const validBankCodes = new Set(bankCodes.map((b) => b.kode));

interface UpdateTenantInput {
  name?: string;
  slug?: string;
  bankCode?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
}

interface UpdateProfileInput {
  name?: string;
  email?: string;
}

interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export const settingsService = {
  // ─── Bank Codes ──────────────────────────────────────────────────────────────

  getBankList() {
    return bankCodes.map((b) => ({ code: b.kode, name: b.nama_bank }));
  },

  // ─── Tenant ─────────────────────────────────────────────────────────────────

  async getTenantInfo(tenantId: string) {
    const result = await db
      .select({
        id: tenants.id,
        name: tenants.name,
        slug: tenants.slug,
        bankCode: tenants.bankCode,
        bankAccountNumber: tenants.bankAccountNumber,
        bankAccountName: tenants.bankAccountName,
        logoUrl: tenants.logoUrl,
        createdAt: tenants.createdAt,
        updatedAt: tenants.updatedAt,
      })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (result.length === 0) {
      throw { status: 404, message: "Tenant tidak ditemukan" };
    }

    const tenant = result[0]!;
    const bankName = tenant.bankCode
      ? (bankCodes.find((b) => b.kode === tenant.bankCode)?.nama_bank ?? null)
      : null;

    return { ...tenant, bankName };
  },

  async updateTenantInfo(tenantId: string, input: UpdateTenantInput) {
    if (input.slug) {
      const slugConflict = await db
        .select({ id: tenants.id })
        .from(tenants)
        .where(and(eq(tenants.slug, input.slug), ne(tenants.id, tenantId)))
        .limit(1);

      if (slugConflict.length > 0) {
        throw {
          status: 409,
          message: `Slug "${input.slug}" sudah digunakan oleh tenant lain`,
        };
      }
    }

    if (
      input.bankCode !== undefined &&
      input.bankCode !== null &&
      input.bankCode !== ""
    ) {
      if (!validBankCodes.has(input.bankCode)) {
        throw {
          status: 400,
          message: `Kode bank "${input.bankCode}" tidak valid. Gunakan GET /api/settings/banks untuk melihat daftar kode bank yang tersedia.`,
        };
      }
    }

    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (input.name !== undefined) updateData.name = input.name;
    if (input.slug !== undefined) updateData.slug = input.slug;
    if (input.bankCode !== undefined) updateData.bankCode = input.bankCode;
    if (input.bankAccountNumber !== undefined)
      updateData.bankAccountNumber = input.bankAccountNumber;
    if (input.bankAccountName !== undefined)
      updateData.bankAccountName = input.bankAccountName;

    await db.update(tenants).set(updateData).where(eq(tenants.id, tenantId));

    return this.getTenantInfo(tenantId);
  },

  async uploadTenantLogo(tenantId: string, file: File) {
    const ALLOWED_TYPES = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    const MAX_SIZE = 2 * 1024 * 1024; // 2MB

    if (!ALLOWED_TYPES.includes(file.type)) {
      throw {
        status: 400,
        message: "Format file tidak didukung. Gunakan JPG, PNG, WebP, atau GIF",
      };
    }

    if (file.size > MAX_SIZE) {
      throw {
        status: 400,
        message: "Ukuran file maksimal 2MB",
      };
    }

    const ext = file.type.split("/")[1]!.replace("jpeg", "jpg");
    const filename = `${tenantId}.${ext}`;
    const uploadDir = path.join(process.cwd(), env.UPLOAD_DIR, "logos");
    const filePath = path.join(uploadDir, filename);

    const buffer = await file.arrayBuffer();
    await Bun.write(filePath, buffer);

    const logoUrl = `${env.BASE_URL}/uploads/logos/${filename}`;

    await db
      .update(tenants)
      .set({ logoUrl, updatedAt: new Date() })
      .where(eq(tenants.id, tenantId));

    return { logoUrl };
  },

  // ─── User Profile ────────────────────────────────────────────────────────────

  async getUserProfile(userId: string) {
    const result = await db
      .select({
        id: users.id,
        tenantId: users.tenantId,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (result.length === 0) {
      throw { status: 404, message: "User tidak ditemukan" };
    }

    return result[0]!;
  },

  async updateProfile(
    userId: string,
    tenantId: string,
    input: UpdateProfileInput,
  ) {
    if (input.email) {
      const emailConflict = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.email, input.email), ne(users.id, userId)))
        .limit(1);

      if (emailConflict.length > 0) {
        throw { status: 409, message: "Email sudah digunakan oleh akun lain" };
      }
    }

    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (input.name !== undefined) updateData.name = input.name;
    if (input.email !== undefined) updateData.email = input.email;

    await db.update(users).set(updateData).where(eq(users.id, userId));

    return this.getUserProfile(userId);
  },

  async changePassword(userId: string, input: ChangePasswordInput) {
    const result = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (result.length === 0) {
      throw { status: 404, message: "User tidak ditemukan" };
    }

    const isValid = await Bun.password.verify(
      input.currentPassword,
      result[0]!.passwordHash,
    );

    if (!isValid) {
      throw { status: 400, message: "Password saat ini tidak sesuai" };
    }

    const newHash = await Bun.password.hash(input.newPassword, {
      algorithm: "bcrypt",
      cost: 10,
    });

    await db
      .update(users)
      .set({ passwordHash: newHash, updatedAt: new Date() })
      .where(eq(users.id, userId));
  },
};
