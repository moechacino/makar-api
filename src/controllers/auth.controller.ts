import type { Context } from "hono";
import { authService } from "../services/auth.service";

export const authController = {
  async registerTenant(c: Context) {
    const body = c.req.valid("json" as never);

    try {
      const result = await authService.registerTenant(body);
      return c.json({ message: "Registrasi berhasil", data: result }, 201);
    } catch (error: any) {
      if (error.status) return c.json({ error: error.message }, error.status);
      console.error("Register error:", error);
      return c.json({ error: "Gagal mendaftar: " + error.message }, 500);
    }
  },

  async login(c: Context) {
    const body = c.req.valid("json" as never);

    try {
      const result = await authService.login(body);
      return c.json({ message: "Login berhasil", data: result });
    } catch (error: any) {
      if (error.status) return c.json({ error: error.message }, error.status);
      console.error("Login error:", error);
      return c.json({ error: "Gagal login: " + error.message }, 500);
    }
  },
};
