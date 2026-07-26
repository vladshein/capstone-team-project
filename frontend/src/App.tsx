import { useState } from "react";
import { MainLayout } from "./layouts/MainLayout";
import HomePage from "./pages/HomePage";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userBalance, setUserBalance] = useState(0);

  const handleOpenSignIn = () => {
    console.log("Відкрити модалку входу");
  };

  const handleOpenSignUp = () => {
    console.log("Відкрити модалку реєстрації");
  };

  return (
    <MainLayout
      isAuthenticated={isAuthenticated}
      userBalance={userBalance}
      onOpenSignIn={handleOpenSignIn}
      onOpenSignUp={handleOpenSignUp}
    >
      <HomePage />
    </MainLayout>
  );
}
