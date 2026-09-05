import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { paymentsApi, WalletData } from '../api/payments';

interface WalletState {
  balance: number;
  frozenBalance: number;
  currency: string;
  transactions: WalletData['transactions'];
  isLoading: boolean;
  error: string | null;
}

const initialState: WalletState = {
  balance: 0,
  frozenBalance: 0,
  currency: 'UAH',
  transactions: [],
  isLoading: false,
  error: null,
};

export const fetchWallet = createAsyncThunk(
  'wallet/fetchWallet',
  async (_, { rejectWithValue }) => {
    try {
      const data = await paymentsApi.getWallet();
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Не вдалося завантажити баланс');
    }
  }
);

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWallet.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWallet.fulfilled, (state, action: PayloadAction<WalletData>) => {
        state.isLoading = false;
        state.balance = action.payload.wallet.balance;
        state.frozenBalance = action.payload.wallet.frozenBalance;
        state.currency = action.payload.wallet.currency;
        state.transactions = action.payload.transactions;
      })
      .addCase(fetchWallet.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export default walletSlice.reducer;
