import { X } from "lucide-react";
import { MobileNav } from "./MobileNav";
import { HeaderAuth } from "./HeaderAuth";

export interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated?: boolean;
  userBalance?: number;
  onOpenSignIn?: () => void;
  onOpenSignUp?: () => void;
}

export function MobileMenu({
  isOpen,
  onClose,
  isAuthenticated = false,
  userBalance = 0,
  onOpenSignIn,
  onOpenSignUp,
}: MobileMenuProps) {
  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-300 md:hidden ${
        isOpen
          ? "pointer-events-auto opacity-100"
          : "pointer-events-none opacity-0"
      }`}
    >
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />

      <div
        className={`absolute right-0 top-0 flex h-full w-[85%] max-w-xs flex-col bg-bg px-5 py-4 shadow-xl transition-transform duration-300 sm:px-6 sm:py-5 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="font-heading text-lg font-bold">Меню</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрити меню"
            className="-mr-2 flex h-11 w-11 items-center justify-center"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <MobileNav onClose={onClose} />

        <HeaderAuth
          mobile
          isAuthenticated={isAuthenticated}
          userBalance={userBalance}
          onOpenSignIn={() => {
            onClose();
            onOpenSignIn?.();
          }}
          onOpenSignUp={() => {
            onClose();
            onOpenSignUp?.();
          }}
        />
      </div>
    </div>
  );
}
