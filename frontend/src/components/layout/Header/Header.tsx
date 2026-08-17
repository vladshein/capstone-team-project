import { useState } from "react";
import { Menu } from "lucide-react";
import { HeaderNav } from "./HeaderNav";
import { HeaderAuth } from "./HeaderAuth";
import { MobileMenu } from "./MobileMenu";
import { ColorSchemeToggle } from "../../ui/ColorSchemeToggle";

export interface HeaderProps {
  onOpenSignIn?: () => void;
  onOpenSignUp?: () => void;
  onLogout?: () => void;
}

export function Header({ onOpenSignIn, onOpenSignUp, onLogout }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <a href="/" className="font-heading text-lg font-bold tracking-tight sm:text-xl">
          Зміна<span className="text-accent">.ua</span>
        </a>

        <HeaderNav />

        <div className="flex items-center gap-2">
          <ColorSchemeToggle />
          <HeaderAuth
            onOpenSignIn={onOpenSignIn}
            onOpenSignUp={onOpenSignUp}
            onLogout={onLogout}
          />
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Відкрити меню"
          className="-mr-2 flex h-11 w-11 items-center justify-center text-ink md:hidden"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      <MobileMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onOpenSignIn={onOpenSignIn}
        onOpenSignUp={onOpenSignUp}
        onLogout={onLogout}
      />
    </header>
  );
}
