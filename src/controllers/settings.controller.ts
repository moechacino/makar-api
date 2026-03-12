import type { Context } from "hono";
import { settingsService } from "../services/settings.service";
import { getTenantId, getCurrentUser } from "../middleware/auth";

export const settingsController = {
  // ─── Banks ──────────────────────────────────────────────────────────────

  getBanks(c: Context) {
    const data = settingsService.getBankList();
    return c.json({ data });
  },

  // ─── Tenant ─────────────────────────────────────────────────────────────────

  async getTenant(c: Context) {
    try {
      const tenantId = getTenantId(c);
      const data = await settingsService.getTenantInfo(tenantId);
      return c.json({ data });
    } catch (err: any) {
      return c.json({ error: err.message }, err.status ?? 500);
    }
  },

  async updateTenant(c: Context) {
    try {
      const tenantId = getTenantId(c);
      const body = await c.req.json();
      const data = await settingsService.updateTenantInfo(tenantId, body);
      return c.json({ message: "Informasi tenant berhasil diperbarui", data });
    } catch (err: any) {
      return c.json({ error: err.message }, err.status ?? 500);
    }
  },

  async uploadLogo(c: Context) {
    try {
      const tenantId = getTenantId(c);
      const body = await c.req.parseBody();
      const file = body["logo"];

      if (!file || !(file instanceof File)) {
        return c.json({ error: "File logo wajib diunggah (field: logo)" }, 400);
      }

      const data = await settingsService.uploadTenantLogo(tenantId, file);
      return c.json({ message: "Logo berhasil diunggah", data });
    } catch (err: any) {
      return c.json({ error: err.message }, err.status ?? 500);
    }
  },

  // ─── User Profile ────────────────────────────────────────────────────────────

  async getProfile(c: Context) {
    try {
      const user = getCurrentUser(c);
      const data = await settingsService.getUserProfile(user.userId);
      return c.json({ data });
    } catch (err: any) {
      return c.json({ error: err.message }, err.status ?? 500);
    }
  },

  async updateProfile(c: Context) {
    try {
      const user = getCurrentUser(c);
      const body = await c.req.json();
      const data = await settingsService.updateProfile(
        user.userId,
        user.tenantId,
        body,
      );
      return c.json({ message: "Profil berhasil diperbarui", data });
    } catch (err: any) {
      return c.json({ error: err.message }, err.status ?? 500);
    }
  },

  async changePassword(c: Context) {
    try {
      const user = getCurrentUser(c);
      const body = await c.req.json();
      await settingsService.changePassword(user.userId, body);
      return c.json({ message: "Password berhasil diubah" });
    } catch (err: any) {
      return c.json({ error: err.message }, err.status ?? 500);
    }
  },
};
