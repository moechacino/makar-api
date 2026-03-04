import { db } from "../db";
import { customers } from "../db/schema";
import { eq, and } from "drizzle-orm";

interface CreateCustomerInput {
  name: string;
  phone?: string;
  email?: string;
  defaultAddress?: string;
}

interface UpdateCustomerInput {
  name?: string;
  phone?: string;
  email?: string;
  defaultAddress?: string;
}

export const customerService = {
  async list(tenantId: string) {
    return db.select().from(customers).where(eq(customers.tenantId, tenantId));
  },

  async getById(tenantId: string, customerId: string) {
    const result = await db
      .select()
      .from(customers)
      .where(
        and(eq(customers.id, customerId), eq(customers.tenantId, tenantId)),
      )
      .limit(1);

    if (result.length === 0) {
      throw { status: 404, message: "Pelanggan tidak ditemukan" };
    }

    return result[0]!;
  },

  async create(tenantId: string, input: CreateCustomerInput) {
    const customerId = crypto.randomUUID();

    await db.insert(customers).values({
      id: customerId,
      tenantId,
      name: input.name,
      phone: input.phone ?? null,
      email: input.email ?? null,
      defaultAddress: input.defaultAddress ?? null,
    });

    return { id: customerId };
  },

  async update(
    tenantId: string,
    customerId: string,
    input: UpdateCustomerInput,
  ) {
    const existing = await db
      .select()
      .from(customers)
      .where(
        and(eq(customers.id, customerId), eq(customers.tenantId, tenantId)),
      )
      .limit(1);

    if (existing.length === 0) {
      throw { status: 404, message: "Pelanggan tidak ditemukan" };
    }

    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (input.name !== undefined) updateData.name = input.name;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.defaultAddress !== undefined)
      updateData.defaultAddress = input.defaultAddress;

    await db
      .update(customers)
      .set(updateData)
      .where(
        and(eq(customers.id, customerId), eq(customers.tenantId, tenantId)),
      );
  },

  async remove(tenantId: string, customerId: string) {
    const existing = await db
      .select()
      .from(customers)
      .where(
        and(eq(customers.id, customerId), eq(customers.tenantId, tenantId)),
      )
      .limit(1);

    if (existing.length === 0) {
      throw { status: 404, message: "Pelanggan tidak ditemukan" };
    }

    await db
      .delete(customers)
      .where(
        and(eq(customers.id, customerId), eq(customers.tenantId, tenantId)),
      );
  },
};
