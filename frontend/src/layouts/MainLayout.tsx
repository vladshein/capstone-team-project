import { ReactNode } from "react";
import { Header } from "../components/layout/Header/Header";
import { Footer } from "../components/layout/Footer";

interface MainLayoutProps {
  children: ReactNode;
  isAuthenticated?: boolean;
  userBalance?: number;
  onOpenSignIn?: () => void;
  onOpenSignUp?: () => void;
}

export function MainLayout({
  children,
  isAuthenticated = false,
  userBalance = 0,
  onOpenSignIn,
  onOpenSignUp,
}: MainLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-white font-['Inter'] text-[#12131A] antialiased">
      <Header
        isAuthenticated={isAuthenticated}
        userBalance={userBalance}
        onOpenSignIn={onOpenSignIn}
        onOpenSignUp={onOpenSignUp}
      />

      <main className="flex-1">{children}</main>

      <Footer />
    </div>
  );
}
