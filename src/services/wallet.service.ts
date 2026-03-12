import { db, pool } from "../db";
import { tenants, walletMutations, withdrawals } from "../db/schema";
import { eq, and, sql } from "drizzle-orm";

export const walletService = {
  async getBalanceAndMutations(tenantId: string) {
    const tenantResult = await db
      .select({ balance: tenants.balance })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (tenantResult.length === 0) {
      throw { status: 404, message: "Tenant tidak ditemukan" };
    }

    const pendingResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(${withdrawals.amount}), 0)`,
      })
      .from(withdrawals)
      .where(
        and(
          eq(withdrawals.tenantId, tenantId),
          sql`${withdrawals.status} IN ('pending', 'processing')`,
        ),
      );

    const balance = tenantResult[0]!.balance;
    const pendingWithdrawals = Number(pendingResult[0]!.total);
    const availableBalance = balance - pendingWithdrawals;

    const mutations = await db
      .select()
      .from(walletMutations)
      .where(eq(walletMutations.tenantId, tenantId))
      .orderBy(sql`${walletMutations.createdAt} DESC`);

    return {
      balance,
      pendingWithdrawals,
      availableBalance,
      mutations,
    };
  },

  async withdraw(tenantId: string, amount: number) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [rows] = await connection.query(
        "SELECT balance, bank_code, bank_account_number, bank_account_name FROM tenants WHERE id = ? FOR UPDATE",
        [tenantId],
      );

      const tenantData = (rows as any[])[0];
      if (!tenantData) {
        await connection.rollback();
        throw { status: 404, message: "Tenant tidak ditemukan" };
      }

      const currentBalance = Number(tenantData.balance);

      if (amount > currentBalance) {
        await connection.rollback();
        throw {
          status: 400,
          message: `Saldo tidak mencukupi. Saldo saat ini: Rp ${currentBalance.toLocaleString("id-ID")}`,
        };
      }

      const newBalance = currentBalance - amount;
      await connection.query("UPDATE tenants SET balance = ? WHERE id = ?", [
        newBalance,
        tenantId,
      ]);

      const withdrawalId = crypto.randomUUID();
      const bankSnapshot = {
        bankCode: tenantData.bank_code,
        bankAccountNumber: tenantData.bank_account_number,
        bankAccountName: tenantData.bank_account_name,
      };

      await connection.query(
        "INSERT INTO withdrawals (id, tenant_id, amount, bank_info_snapshot, withdrawal_status, created_at) VALUES (?, ?, ?, ?, 'pending', NOW())",
        [withdrawalId, tenantId, amount, JSON.stringify(bankSnapshot)],
      );

      const mutationId = crypto.randomUUID();
      await connection.query(
        "INSERT INTO wallet_mutations (id, tenant_id, mutation_type, amount, description, reference_id, created_at) VALUES (?, ?, 'debit', ?, ?, ?, NOW())",
        [
          mutationId,
          tenantId,
          amount,
          `Penarikan Dana - ${withdrawalId}`,
          withdrawalId,
        ],
      );

      await connection.commit();

      return {
        id: withdrawalId,
        amount,
        newBalance,
        status: "pending" as const,
        bankInfo: bankSnapshot,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async listWithdrawals(tenantId: string) {
    return db
      .select()
      .from(withdrawals)
      .where(eq(withdrawals.tenantId, tenantId))
      .orderBy(sql`${withdrawals.createdAt} DESC`);
  },
};
