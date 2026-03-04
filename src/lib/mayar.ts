import { env } from "../config/env";

interface MayarInvoiceItem {
  quantity: number;
  rate: number;
  description: string;
}

interface CreateMayarInvoiceParams {
  name: string;
  email: string;
  mobile: string;
  description?: string;
  items: MayarInvoiceItem[];
  redirectUrl?: string;
  expiredAt?: string;
  extraData?: Record<string, string>;
}

interface MayarInvoiceResponse {
  statusCode: number;
  messages: string;
  data: {
    id: string;
    transactionId: string;
    link: string;
    expiredAt: number;
  };
}

/**
 * Mayar API client using Master API Key (Platform/Escrow model)
 */
export const mayarClient = {
  /**
   * Create an invoice via Mayar API
   */
  async createInvoice(
    params: CreateMayarInvoiceParams,
  ): Promise<MayarInvoiceResponse> {
    const response = await fetch(`${env.MAYAR_BASE_URL}/invoice/create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.MAYAR_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Mayar API error: ${response.status} - ${errorBody}`);
    }

    return response.json() as Promise<MayarInvoiceResponse>;
  },

  /**
   * Get invoice detail/status from Mayar
   */
  async getInvoice(invoiceId: string) {
    const response = await fetch(`${env.MAYAR_BASE_URL}/invoice/${invoiceId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${env.MAYAR_API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Mayar API error: ${response.status} - ${errorBody}`);
    }

    return response.json();
  },
};
