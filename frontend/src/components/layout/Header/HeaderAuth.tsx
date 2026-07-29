import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { LogoutButton } from "../../ui/LogoutButton";

export interface UserData {
  id: number;
  email: string;
  role: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface HeaderAuthProps {
  isAuthenticated?: boolean;
  user?: UserData | null;
  userBalance?: number;
  onOpenSignIn?: () => void;
  onOpenSignUp?: () => void;
  onLogout?: () => void;
  mobile?: boolean;
}

export function HeaderAuth({
  isAuthenticated = false,
  user = null,
  userBalance = 0,
  onOpenSignIn,
  onOpenSignUp,
  onLogout,
  mobile = false,
}: HeaderAuthProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [isMenuOpen]);

  if (mobile) {
    return (
      <div className="mt-auto flex flex-col gap-3">
        {isAuthenticated ? (
          <>
            <a
              href="/profile"
              className="flex min-h-[44px] items-center justify-center rounded-[var(--radius-pill)] border border-border px-5 text-sm font-medium"
            >
              Профіль · {userBalance}₴
            </a>
            <LogoutButton onLogout={onLogout} variant="mobile" />
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onOpenSignIn}
              className="min-h-[44px] rounded-[var(--radius-pill)] border border-border px-5 text-sm font-medium"
            >
              Увійти
            </button>
            <button
              type="button"
              onClick={onOpenSignUp}
              className="min-h-[44px] rounded-[var(--radius-pill)] bg-ink px-5 text-sm font-medium text-white"
            >
              Реєстрація
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="hidden items-center gap-3 md:flex">
      {isAuthenticated ? (
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-expanded={isMenuOpen}
            aria-haspopup="menu"
            className="flex items-center gap-2 rounded-[var(--radius-pill)] border border-border py-1.5 pl-1.5 pr-3 text-sm font-medium hover:border-accent"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-xs text-white">
              ПБ
            </span>
            <span className="font-mono">{userBalance}₴</span>
            <ChevronDown className="h-4 w-4 text-text-subtle" />
          </button>

          {isMenuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-[calc(100%+0.5rem)] w-48 rounded-[var(--radius-card)] border border-border bg-bg p-1.5 shadow-lg"
            >
              <a
                href="/profile"
                role="menuitem"
                className="block rounded-[var(--radius-card)] px-3 py-2.5 text-sm hover:bg-bg-muted"
              >
                Профіль
              </a>
              <LogoutButton onLogout={onLogout} />
            </div>
          )}
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={onOpenSignIn}
            className="text-sm font-medium text-ink hover:text-accent"
          >
            Увійти
          </button>
          <button
            type="button"
            onClick={onOpenSignUp}
            className="rounded-[var(--radius-pill)] bg-ink px-5 py-2 text-sm font-medium text-white hover:bg-accent"
          >
            Реєстрація
          </button>
        </>
      )}
    </div>
  );
}