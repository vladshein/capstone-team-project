import { createSlice } from "@reduxjs/toolkit";
import {
  fetchMyCompanies,
  fetchCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
} from "./actions";
import type { CompaniesProfileState } from "./types";

const companiesInitialState: CompaniesProfileState = {
  items: [],
  selected: null,
  status: "idle",
  selectedStatus: "idle",
  error: null,
};

const companiesProfileSlice = createSlice({
  name: "companiesProfile",
  initialState: companiesInitialState,
  reducers: {
    clearCompaniesProfile: () => companiesInitialState,
  },
  extraReducers: (builder) =>
    builder
      // --- список своїх компаній ---
      .addCase(fetchMyCompanies.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchMyCompanies.fulfilled, (state, { payload }) => {
        state.status = "succeeded";
        state.items = payload;
      })
      .addCase(fetchMyCompanies.rejected, (state, { payload }) => {
        state.status = "failed";
        state.error = payload ?? { message: "Сталася помилка. Спробуйте ще раз." };
      })

      // --- публічна картка однієї компанії ---
      .addCase(fetchCompanyById.pending, (state) => {
        state.selectedStatus = "loading";
        state.error = null;
      })
      .addCase(fetchCompanyById.fulfilled, (state, { payload }) => {
        state.selectedStatus = "succeeded";
        state.selected = payload;
      })
      .addCase(fetchCompanyById.rejected, (state, { payload }) => {
        state.selectedStatus = "failed";
        state.error = payload ?? { message: "Сталася помилка. Спробуйте ще раз." };
      })

      // --- create / update / delete: локальна мутація items без рефетчу ---
      .addCase(createCompany.fulfilled, (state, { payload }) => {
        state.items.push(payload);
      })
      .addCase(updateCompany.fulfilled, (state, { payload }) => {
        const index = state.items.findIndex((c) => c.id === payload.id);
        if (index !== -1) state.items[index] = payload;
      })
      .addCase(deleteCompany.fulfilled, (state, { payload }) => {
        state.items = state.items.filter((c) => c.id !== payload); // було payload.id
      })
});

export const { clearCompaniesProfile } = companiesProfileSlice.actions;
export default companiesProfileSlice.reducer;