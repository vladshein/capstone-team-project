import { createAsyncThunk } from "@reduxjs/toolkit";
import { profileService } from "../../services/companiesProfileService";
import { companiesActions } from "./constants";
import type { CompanyProfile } from "./types";
import type { ApiError } from "../types";
import { toApiError } from "../utils"

export const fetchMyCompanies = createAsyncThunk<CompanyProfile[], void, { rejectValue: ApiError }>(
  companiesActions.FETCH_MY_COMPANIES,
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await profileService.fetchMyCompanies();
      return data;
    } catch (error) {
      return rejectWithValue(toApiError(error));
    }
  },
);

export const fetchCompanyById = createAsyncThunk<CompanyProfile, number, { rejectValue: ApiError }>(
  companiesActions.FETCH_COMPANY_BY_ID,
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await profileService.getCompanyCompaniById(id);
      return data;
    } catch (error) {
      return rejectWithValue(toApiError(error));
    }
  },
);

export const createCompany = createAsyncThunk<CompanyProfile, number, { rejectValue: ApiError }>(
  companiesActions.CREATE_COMPANY,
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await profileService.createCompanyProfile();
      return data;
    } catch (error) {
      return rejectWithValue(toApiError(error));
    }
  },
);

export const updateCompany = createAsyncThunk<CompanyProfile, number, { rejectValue: ApiError }>(
  companiesActions.UPDATE_COMPANY,
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await profileService.updateCompanyProfile(id);
      return data;
    } catch (error) {
      return rejectWithValue(toApiError(error));
    }
  },
);

export const deleteCompany = createAsyncThunk<CompanyProfile, number, { rejectValue: ApiError }>(
  companiesActions.DELETE_COMPANY,
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await profileService.deleteCompanyProfile(id);
      return data;
    } catch (error) {
      return rejectWithValue(toApiError(error));
    }
  },
);
