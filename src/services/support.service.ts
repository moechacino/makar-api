import { db } from "../db";
import { supportUsers, withdrawals, tenants } from "../db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { generateSupportToken } from "../middleware/supportAuth";

type WithdrawalStatus = "pending" | "processing" | "completed" | "failed";

export const supportService = {
  // ─── Auth ─────────────────────────────────────────────────────────────────

  async register(input: { name: string; email: string; password: string }) {
    const existing = await db
      .select({ id: supportUsers.id })
      .from(supportUsers)
      .where(eq(supportUsers.email, input.email))
      .limit(1);

    if (existing.length > 0) {
      throw { status: 409, message: "Email sudah terdaftar" };
    }

    const passwordHash = await Bun.password.hash(input.password, {
      algorithm: "bcrypt",
      cost: 10,
    });

    const id = crypto.randomUUID();

    await db.insert(supportUsers).values({
      id,
      name: input.name,
      email: input.email,
      passwordHash,
    });

    const user = await db
      .select({
        id: supportUsers.id,
        name: supportUsers.name,
        email: supportUsers.email,
      })
      .from(supportUsers)
      .where(eq(supportUsers.id, id))
      .limit(1);

    return user[0]!;
  },

  async login(email: string, password: string) {
    const result = await db
      .select()
      .from(supportUsers)
      .where(eq(supportUsers.email, email))
      .limit(1);

    if (result.length === 0) {
      throw { status: 401, message: "Email atau password salah" };
    }

    const user = result[0]!;
    const isValid = await Bun.password.verify(password, user.passwordHash);

    if (!isValid) {
      throw { status: 401, message: "Email atau password salah" };
    }

    const token = generateSupportToken({
      supportUserId: user.id,
      email: user.email,
      role: "support",
    });

    return {
      token,
      user: { id: user.id, name: user.name, email: user.email },
    };
  },

  // ─── Withdrawal Management ────────────────────────────────────────────────

  async listWithdrawals(filters: {
    status?: WithdrawalStatus;
    tenantId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (filters.status) {
      conditions.push(eq(withdrawals.status, filters.status));
    }
    if (filters.tenantId) {
      conditions.push(eq(withdrawals.tenantId, filters.tenantId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select({
        id: withdrawals.id,
        amount: withdrawals.amount,
        bankInfoSnapshot: withdrawals.bankInfoSnapshot,
        status: withdrawals.status,
        disbursementId: withdrawals.disbursementId,
        createdAt: withdrawals.createdAt,
        completedAt: withdrawals.completedAt,
        tenantId: tenants.id,
        tenantName: tenants.name,
        tenantSlug: tenants.slug,
      })
      .from(withdrawals)
      .leftJoin(tenants, eq(withdrawals.tenantId, tenants.id))
      .where(whereClause)
      .orderBy(desc(withdrawals.createdAt))
      .limit(limit)
      .offset(offset);

    const countResult = await db
      .select({ total: sql<number>`COUNT(*)` })
      .from(withdrawals)
      .where(whereClause);

    const total = Number(countResult[0]!.total);

    return {
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getWithdrawal(id: string) {
    const rows = await db
      .select({
        id: withdrawals.id,
        amount: withdrawals.amount,
        bankInfoSnapshot: withdrawals.bankInfoSnapshot,
        status: withdrawals.status,
        disbursementId: withdrawals.disbursementId,
        createdAt: withdrawals.createdAt,
        completedAt: withdrawals.completedAt,
        tenantId: tenants.id,
        tenantName: tenants.name,
        tenantSlug: tenants.slug,
      })
      .from(withdrawals)
      .leftJoin(tenants, eq(withdrawals.tenantId, tenants.id))
      .where(eq(withdrawals.id, id))
      .limit(1);

    if (rows.length === 0) {
      throw { status: 404, message: "Withdrawal tidak ditemukan" };
    }

    return rows[0]!;
  },

  async updateWithdrawalStatus(
    id: string,
    input: { status: WithdrawalStatus; disbursementId?: string },
  ) {
    const existing = await db
      .select({ status: withdrawals.status })
      .from(withdrawals)
      .where(eq(withdrawals.id, id))
      .limit(1);

    if (existing.length === 0) {
      throw { status: 404, message: "Withdrawal tidak ditemukan" };
    }

    const current = existing[0]!.status;

    // State machine validation
    const allowed: Record<WithdrawalStatus, WithdrawalStatus[]> = {
      pending: ["processing", "failed"],
      processing: ["completed", "failed"],
      completed: [],
      failed: [],
    };

    if (!allowed[current].includes(input.status)) {
      throw {
        status: 400,
        message: `Tidak dapat mengubah status dari "${current}" ke "${input.status}"`,
      };
    }

    const updateData: Record<string, any> = { status: input.status };
    if (input.disbursementId !== undefined) {
      updateData.disbursementId = input.disbursementId;
    }
    if (input.status === "completed") {
      updateData.completedAt = new Date();
    }

    await db.update(withdrawals).set(updateData).where(eq(withdrawals.id, id));

    return this.getWithdrawal(id);
  },
};
