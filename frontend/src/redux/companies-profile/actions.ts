import { createAsyncThunk } from "@reduxjs/toolkit";
import { companiesProfileService } from "../../services/companiesProfileService";
import { companiesActions } from "./constants";
import type { CompanyProfile, CreateCompanyPayload, UpdateCompanyPayload } from "./types";
import type { ApiError } from "../types";
import { toApiError } from "../utils";

// Не імпортуємо RootState сюди: store залежить від цього slice, тому такий
// імпорт створює циклічний тип під час виведення configureStore.
type CompaniesRequestState = {
  companiesProfile: { status: "idle" | "loading" | "succeeded" | "failed" };
};

export const fetchMyCompanies = createAsyncThunk<
  CompanyProfile[],
  void,
  { state: CompaniesRequestState; rejectValue: ApiError }
>(
  companiesActions.FETCH_MY_COMPANIES,
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await companiesProfileService.fetchMyCompanies();
      return data.data; // розгортаємо бекенд-обгортку
    } catch (error) {
      return rejectWithValue(toApiError(error));
    }
  },
  {
    // Header і сторінки кабінету можуть монтуватися одночасно. Захист тут
    // прибирає дубльований GET незалежно від порядку виконання useEffect.
    condition: (_, { getState }) => getState().companiesProfile.status !== "loading",
  },
);

export const fetchCompanyById = createAsyncThunk<CompanyProfile, number, { rejectValue: ApiError }>(
  companiesActions.FETCH_COMPANY_BY_ID,
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await companiesProfileService.getCompanyById(id);
      return data.data; // було return data
    } catch (error) {
      return rejectWithValue(toApiError(error));
    }
  },
);

export const createCompany = createAsyncThunk<CompanyProfile, CreateCompanyPayload, { rejectValue: ApiError }>(
  companiesActions.CREATE_COMPANY,
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await companiesProfileService.createCompanyProfile(payload);
      return data.data; // було return data
    } catch (error) {
      return rejectWithValue(toApiError(error));
    }
  },
);

export const updateCompany = createAsyncThunk<
  CompanyProfile,
  { id: number; payload: UpdateCompanyPayload },
  { rejectValue: ApiError }
>(
  companiesActions.UPDATE_COMPANY,
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const { data } = await companiesProfileService.updateCompanyProfile(id, payload);
      return data.data; // було return data
    } catch (error) {
      return rejectWithValue(toApiError(error));
    }
  },
);

export const deleteCompany = createAsyncThunk<
  number, number, { rejectValue: ApiError }>(
  companiesActions.DELETE_COMPANY,
  async (id, { rejectWithValue }) => {
    try {
      await companiesProfileService.deleteCompanyProfile(id);
      return id; // backend повертає лише {success:true} — reducer фільтрує items по id, тож повертаємо саме id
    } catch (error) {
      return rejectWithValue(toApiError(error));
    }
  },
);
