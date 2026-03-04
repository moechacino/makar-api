import type { Context } from "hono";
import { getTenantId } from "../middleware/auth";
import { reportService } from "../services/report.service";

export const reportController = {
  async kitchenRecap(c: Context) {
    const tenantId = getTenantId(c);
    const startDate = c.req.query("startDate");
    const endDate = c.req.query("endDate");

    if (!startDate || !endDate) {
      return c.json(
        {
          error:
            "Parameter startDate dan endDate wajib diisi (format: YYYY-MM-DD)",
        },
        400,
      );
    }

    try {
      const data = await reportService.getKitchenRecap(
        tenantId,
        startDate,
        endDate,
      );
      return c.json({ data });
    } catch (error: any) {
      if (error.status) return c.json({ error: error.message }, error.status);
      console.error("Kitchen recap error:", error);
      return c.json(
        { error: "Gagal membuat rekap dapur: " + error.message },
        500,
      );
    }
  },
};
