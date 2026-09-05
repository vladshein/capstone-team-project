import client from './client';

export interface WalletData {
  wallet: {
    id: number;
    balance: number;
    pendingBalance: number;
    currency: string;
  };
  transactions: Array<{
    id: number;
    amount: number;
    type: string;
    status: string;
    description: string;
    createdAt: string;
  }>;
}

export interface InvoiceResponse {
  pageUrl: string;
  invoiceId: string;
  amount: number;
}

export const paymentsApi = {
  getWallet: async (): Promise<WalletData> => {
    const { data } = await client.get('/payments/wallet');
    return data;
  },

  createInvoice: async (shiftId: number, applicationId: number): Promise<InvoiceResponse> => {
    const { data } = await client.post('/payments/invoice', { shiftId, applicationId });
    return data;
  },
};