import { ReactNode } from "react";
import { Header } from "../components/layout/Header/Header";
import { Footer } from "../components/layout/Footer";

interface MainLayoutProps {
  children: ReactNode;
  isAuthenticated?: boolean;
  userRole?: string;
  userBalance?: number;
  onOpenSignIn?: () => void;
  onOpenSignUp?: () => void;
  onLogout?: () => void;
}

export function MainLayout({
  children,
  isAuthenticated = false,
  userRole,
  userBalance = 0,
  onOpenSignIn,
  onOpenSignUp,
  onLogout,
}: MainLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-white font-['Inter'] text-[#12131A] antialiased">
      <Header
        isAuthenticated={isAuthenticated}
        userRole={userRole}
        userBalance={userBalance}
        onOpenSignIn={onOpenSignIn}
        onOpenSignUp={onOpenSignUp}
        onLogout={onLogout}
      />

      <main className="flex-1">{children}</main>

      <Footer />
    </div>
  );
}