export interface HeaderAuthProps {
  isAuthenticated?: boolean;
  userBalance?: number;
  onOpenSignIn?: () => void;
  onOpenSignUp?: () => void;
  mobile?: boolean;
}

export function HeaderAuth({
  isAuthenticated = false,
  userBalance = 0,
  onOpenSignIn,
  onOpenSignUp,
  mobile = false,
}: HeaderAuthProps) {
  if (mobile) {
    return (
      <div className="mt-auto flex flex-col gap-3">
        {isAuthenticated ? (
          <a
            href="/profile"
            className="flex min-h-[44px] items-center justify-center rounded-[var(--radius-pill)] border border-border px-5 text-sm font-medium"
          >
            Профіль · {userBalance}₴
          </a>
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
        <a
          href="/profile"
          className="flex items-center gap-2 rounded-[var(--radius-pill)] border border-border py-1.5 pl-1.5 pr-4 text-sm font-medium hover:border-accent"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-xs text-white">
            ПБ
          </span>
          <span className="font-mono">{userBalance}₴</span>
        </a>
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
