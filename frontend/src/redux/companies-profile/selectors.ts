import type { RootState } from "../store";

export const selectCompanies = (state: RootState) => state.companiesProfile.items;
export const selectCompaniesStatus = (state: RootState) => state.companiesProfile.status;
export const selectCompaniesError = (state: RootState) => state.companiesProfile.error;

export const selectSelectedCompany = (state: RootState) => state.companiesProfile.selected;
export const selectSelectedCompanyStatus = (state: RootState) => state.companiesProfile.selectedStatus;

export const selectCompaniesCount = (state: RootState) => state.companiesProfile.items.length;

export const selectCompanyById = (id: number) => (state: RootState) =>
  state.companiesProfile.items.find((company) => company.id === id) ?? null;