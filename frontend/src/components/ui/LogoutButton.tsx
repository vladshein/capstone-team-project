import { LogOut } from "lucide-react";

interface LogoutButtonProps {
  onLogout?: () => void;
  variant?: "menu-item" | "mobile";
}

export function LogoutButton({
  onLogout,
  variant = "menu-item",
}: LogoutButtonProps) {
  if (variant === "mobile") {
    return (
      <button
        type="button"
        onClick={onLogout}
        className="flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-pill)] border border-border px-5 text-sm font-medium text-danger"
      >
        <LogOut className="h-4 w-4" />
        Вийти
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onLogout}
      className="flex w-full items-center gap-2 rounded-[var(--radius-card)] px-3 py-2.5 text-left text-sm text-danger hover:bg-bg-muted"
    >
      <LogOut className="h-4 w-4" />
      Вийти
    </button>
  );
}