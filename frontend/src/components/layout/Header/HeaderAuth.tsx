import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { LogoutButton } from "../../ui/LogoutButton";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { selectIsLoggedIn, selectUserInfo } from "../../../redux/auth/selectors";
import { refreshUser } from "../../../redux/auth/actions";
import { getDashboardPath } from "../../../redux/auth/helpers";
import { USER_ROLES } from "../../../constants/navigation";
import { selectHasWorkerProfile } from "../../../redux/auth/selectors";
import {
  selectCompanies,
  selectCompaniesCount,
  selectCompaniesStatus,
} from "../../../redux/companies-profile/selectors";
import { fetchMyCompanies } from "../../../redux/companies-profile/actions";
import { getAvatarInitials } from "../../../utils/getAvatarInitials";

export interface HeaderAuthProps {
  onOpenSignIn?: () => void;
  onOpenSignUp?: () => void;
  onLogout: () => void;
  mobile?: boolean;
  isMobileMenuOpen?: boolean;
}

export function HeaderAuth({
  onOpenSignIn,
  onOpenSignUp,
  onLogout,
  mobile = false,
  isMobileMenuOpen = false,
}: HeaderAuthProps) {
  const dispatch = useAppDispatch();

  const isAuthenticated = useAppSelector(selectIsLoggedIn);
  const user = useAppSelector(selectUserInfo);

  const hasWorkerProfile = useAppSelector(selectHasWorkerProfile);
  const companies = useAppSelector(selectCompanies);
  const companiesCount = useAppSelector(selectCompaniesCount);
  const companiesStatus = useAppSelector(selectCompaniesStatus);

  const isWorker = user?.role === USER_ROLES.WORKER;
  const isBusiness = user?.role === USER_ROLES.BUSINESS;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCompanyMenuOpen, setIsCompanyMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const companyMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen && !isCompanyMenuOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
      if (companyMenuRef.current && !companyMenuRef.current.contains(e.target as Node)) {
        setIsCompanyMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [isMenuOpen, isCompanyMenuOpen]);

  useEffect(() => {
    if (isAuthenticated && !user) {
      void dispatch(refreshUser());
    }
  }, [isAuthenticated, user, dispatch]);

  // Bootstrap already містить кількість компаній. Повний список потрібен лише
  // у відкритому меню — не завантажуємо його на кожній сторінці бізнес-акаунта.
  useEffect(() => {
    const needsCompanyList = isMenuOpen || isMobileMenuOpen;
    if (isBusiness && needsCompanyList && companiesStatus === "idle") {
      void dispatch(fetchMyCompanies());
    }
  }, [isBusiness, isMenuOpen, isMobileMenuOpen, companiesStatus, dispatch]);

  const handleLogout = () => {
    // Єдиний logout-обробник живе в App: там очищуються всі залежні стани.
    setIsMenuOpen(false);
    setIsCompanyMenuOpen(false);
    onLogout?.();
  };

  const profileLink = getDashboardPath(user?.role);

  // ---- role-specific menu items -------------------------------------
  const workerLinks = isWorker && (
    <>
      <Link to="/profile" role="menuitem" className="block rounded-[var(--radius-card)] px-3 py-2.5 text-sm hover:bg-bg-muted">
        Профіль
      </Link>
      <Link to={profileLink} role="menuitem" className="block rounded-[var(--radius-card)] px-3 py-2.5 text-sm hover:bg-bg-muted">
        Кабінет виконавця
      </Link>
    </>
  );

  const businessLinks = isBusiness && (
    <>
      <Link to={profileLink} role="menuitem" className="block rounded-[var(--radius-card)] px-3 py-2.5 text-sm hover:bg-bg-muted">
        Кабінет замовника
      </Link>

      {companiesCount === 0 ? (
        <Link to={profileLink} role="menuitem" className="block rounded-[var(--radius-card)] px-3 py-2.5 text-sm hover:bg-bg-muted">
          Додати компанію
        </Link>
      ) : (
        <div ref={companyMenuRef} className="relative">
          <button
            type="button"
            role="menuitem"
            onClick={() => setIsCompanyMenuOpen((open) => !open)}
            className="flex w-full items-center justify-between rounded-[var(--radius-card)] px-3 py-2.5 text-left text-sm hover:bg-bg-muted"
          >
            Мої компанії ({companiesCount})
            <ChevronDown className="h-4 w-4 text-text-subtle" />
          </button>

          {isCompanyMenuOpen && (
            <div className="mt-1 space-y-0.5 border-l border-border pl-2">
              {companies.map((company) => (
                <Link
                  key={company.id}
                  to="/profile"
                  state={{ companyId: company.id }}
                  role="menuitem"
                  className="block truncate rounded-[var(--radius-card)] px-3 py-2 text-sm hover:bg-bg-muted"
                  onClick={() => setIsCompanyMenuOpen(false)}
                >
                  {company.name}
                </Link>
              ))}
              <Link
                to="/profile"
                state={{ openCreate: true }}
                role="menuitem"
                className="block rounded-[var(--radius-card)] px-3 py-2 text-sm text-text-subtle hover:bg-bg-muted"
                onClick={() => setIsCompanyMenuOpen(false)}
              >
                + Додати компанію
              </Link>
            </div>
          )}
        </div>
      )}
    </>
  );

  if (mobile) {
    return (
      <div className="mt-auto flex flex-col gap-3">
        {isAuthenticated && user ? (
          <>
            {isWorker && (
              <>
                <Link to="/profile" className="flex min-h-[44px] items-center justify-center rounded-[var(--radius-pill)] border border-border px-5 text-sm font-medium">
                  Профіль
                </Link>
                <Link to={profileLink} className="flex min-h-[44px] items-center justify-center rounded-[var(--radius-pill)] border border-border px-5 text-sm font-medium">
                  Кабінет виконавця
                </Link>
              </>
            )}

            {isBusiness && (
              <>
                <Link to={profileLink} className="flex min-h-[44px] items-center justify-center rounded-[var(--radius-pill)] border border-border px-5 text-sm font-medium">
                  Кабінет замовника
                </Link>
                {companiesCount === 0 ? (
                  <Link
                    to="/profile"
                    state={{ openCreate: true }}
                    className="flex min-h-[44px] items-center justify-center rounded-[var(--radius-pill)] border border-border px-5 text-sm font-medium"
                  >
                    Додати компанію
                  </Link>
                ) : (
                  companies.map((company) => (
                    <Link
                      key={company.id}
                      to="/profile"
                      state={{ companyId: company.id }}
                      className="flex min-h-[44px] items-center justify-center rounded-[var(--radius-pill)] border border-border px-5 text-sm font-medium"
                    >
                      {company.name}
                    </Link>
                  ))
                )}
              </>
            )}

            <LogoutButton onLogout={handleLogout} variant="mobile" />
          </>
        ) : (
          <>
            <button type="button" onClick={onOpenSignIn} className="min-h-[44px] rounded-[var(--radius-pill)] border border-border px-5 text-sm font-medium">
              Увійти
            </button>
            <button type="button" onClick={onOpenSignUp} className="min-h-[44px] rounded-[var(--radius-pill)] bg-bg-inverse px-5 text-sm font-medium text-white">
              Реєстрація
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="hidden items-center gap-3 md:flex">
      {isAuthenticated && user ? (
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-expanded={isMenuOpen}
            aria-haspopup="menu"
            className="flex items-center gap-2 rounded-[var(--radius-pill)] border border-border py-1.5 pl-1.5 pr-3 text-sm font-medium hover:border-accent"
          >
            {user.avatar ? (
              <img src={user.avatar} alt="" className="h-7 w-7 rounded-full object-cover" />
            ) : (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-bg-inverse text-xs text-white">
                {getAvatarInitials(user.displayName)}
              </span>
            )}
            <ChevronDown className="h-4 w-4 text-text-subtle" />
          </button>

          {isMenuOpen && (
            <div role="menu" className="absolute right-0 top-[calc(100%+0.5rem)] w-56 rounded-[var(--radius-card)] border border-border bg-bg p-1.5 shadow-lg">
              {workerLinks}
              {businessLinks}
              <LogoutButton onLogout={handleLogout} />
            </div>
          )}
        </div>
      ) : (
        <>
          <button type="button" onClick={onOpenSignIn} className="text-sm font-medium text-ink hover:text-accent">
            Увійти
          </button>
          <button type="button" onClick={onOpenSignUp} className="rounded-[var(--radius-pill)] bg-bg-inverse px-5 py-2 text-sm font-medium text-white hover:bg-accent">
            Реєстрація
          </button>
        </>
      )}
    </div>
  );
}
