import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import { selectIsLoggedIn, selectUserInfo } from "../redux/auth/selectors";
import { useAppSelector } from "../redux/hooks";

export function useBusinessCta(onOpenBusinessSignUp?: () => void) {
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector(selectIsLoggedIn);
  const user = useAppSelector(selectUserInfo);

  return () => {
    if (!isAuthenticated) {
      onOpenBusinessSignUp?.();
      return;
    }

    if (user?.role === "business_client") {
      navigate("/dashboard");
      return;
    }

    toast("Для розміщення вакансій потрібен бізнес-акаунт.", { icon: "ℹ️" });
  };
}
