import { combineReducers, configureStore } from "@reduxjs/toolkit";
import storage from "redux-persist/es/storage/index.js";
import {
  FLUSH,
  PAUSE,
  PERSIST,
  persistReducer,
  persistStore,
  PURGE,
  REGISTER,
  REHYDRATE,
  type PersistConfig,
} from "redux-persist";
import { authReducer } from "./auth/slice";
import workerProfileSliceReducer from "./worker-profile/slice";
import companiesProfileReducer from "./companies-profile/slice";
import { shiftReducer } from "./shift/slice";
import { workerStatisticsReducer } from "./worker-statistics/slice";
import type { AuthState } from "./auth/types";

const authPersistConfig: PersistConfig<AuthState> = {
  key: "auth",
  storage,
  whitelist: ["token", "isLoggedIn", "user"],
};

const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  workerProfile: workerProfileSliceReducer,
  companiesProfile: companiesProfileReducer,
  shift: shiftReducer,
  workerStatistics: workerStatisticsReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;