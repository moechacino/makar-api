import { db } from "../db";
import { tenants, users } from "../db/schema";
import { eq } from "drizzle-orm";
import { generateToken } from "../middleware/auth";

interface RegisterTenantInput {
  tenantName: string;
  slug: string;
  name: string;
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

export const authService = {
  async registerTenant(input: RegisterTenantInput) {
    // Check if slug already taken
    const existingTenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, input.slug))
      .limit(1);

    if (existingTenant.length > 0) {
      throw { status: 409, message: "Slug sudah digunakan" };
    }

    // Check if email already taken
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);

    if (existingUser.length > 0) {
      throw { status: 409, message: "Email sudah terdaftar" };
    }

    // Hash password
    const passwordHash = await Bun.password.hash(input.password, {
      algorithm: "bcrypt",
      cost: 10,
    });

    const tenantId = crypto.randomUUID();
    const userId = crypto.randomUUID();

    await db.insert(tenants).values({
      id: tenantId,
      name: input.tenantName,
      slug: input.slug,
    });

    await db.insert(users).values({
      id: userId,
      tenantId,
      name: input.name,
      email: input.email,
      passwordHash,
      role: "owner",
    });

    const token = generateToken({
      userId,
      tenantId,
      email: input.email,
      role: "owner",
    });

    return {
      token,
      tenant: { id: tenantId, name: input.tenantName, slug: input.slug },
      user: {
        id: userId,
        name: input.name,
        email: input.email,
        role: "owner" as const,
      },
    };
  },

  async login(input: LoginInput) {
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);

    if (userResult.length === 0) {
      throw { status: 401, message: "Email atau password salah" };
    }

    const user = userResult[0]!;

    const isPasswordValid = await Bun.password.verify(
      input.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw { status: 401, message: "Email atau password salah" };
    }

    const token = generateToken({
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      },
    };
  },
};
