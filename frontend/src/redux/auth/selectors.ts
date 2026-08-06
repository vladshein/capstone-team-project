import type { RootState } from "../store";

export const selectIsLoggedIn = (state: RootState) => state.auth.isLoggedIn;
export const selectUserInfo = (state: RootState) => state.auth.user;
export const selectUserId = (state: RootState) => state.auth.user?.id;
export const selectUserName = (state: RootState) => state.auth.user?.email;
export const selectUserAvatar = (state: RootState) => state.auth.user?.avatar;
export const selectIsLoading = (state: RootState) => state.auth.isLoading;
export const selectIsRefreshing = (state: RootState) => state.auth.isRefreshing;
export const selectAuthError = (state: RootState) => state.auth.error;
