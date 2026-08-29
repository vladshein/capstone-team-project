import { ReactNode } from "react";
import { Header } from "../components/layout/Header/Header";
import { Footer } from "../components/layout/Footer";

interface MainLayoutProps {
  children: ReactNode;
  onOpenSignIn?: () => void;
  onOpenSignUp?: () => void;
  onOpenBusinessSignUp?: () => void;
  onLogout?: () => void;
}

export function MainLayout({
  children,
  onOpenSignIn,
  onOpenSignUp,
  onOpenBusinessSignUp,
  onLogout,
}: MainLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-bg font-body text-ink antialiased">
      <Header
        onOpenSignIn={onOpenSignIn}
        onOpenSignUp={onOpenSignUp}
        onLogout={onLogout}
      />

      <main className="flex-1">{children}</main>

      <Footer onOpenBusinessSignUp={onOpenBusinessSignUp} />
    </div>
  );
}
