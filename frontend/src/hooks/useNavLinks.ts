import { useAppSelector } from "../redux/hooks";
import { selectIsLoggedIn, selectUserInfo } from "../redux/auth/selectors";
import { getFilteredNavLinks } from "../utils/navigation";

export function useNavLinks() {
  const isAuthenticated = useAppSelector(selectIsLoggedIn);
  const user = useAppSelector(selectUserInfo);

  return getFilteredNavLinks(isAuthenticated, user?.role);
}