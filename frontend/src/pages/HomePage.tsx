import { Hero } from "../sectionsHero/Hero";
import { useBusinessCta } from "../hooks/useBusinessCta";
import { selectIsLoggedIn, selectUserInfo } from "../redux/auth/selectors";
import { useAppSelector } from "../redux/hooks";

interface HomePageProps {
  onOpenSignUp?: () => void;
  onOpenBusinessSignUp?: () => void;
}

export default function HomePage({ onOpenSignUp, onOpenBusinessSignUp }: HomePageProps) {
  const handleBusinessCta = useBusinessCta(onOpenBusinessSignUp);
  const isAuthenticated = useAppSelector(selectIsLoggedIn);
  const user = useAppSelector(selectUserInfo);

  return (
    <div className="min-h-screen bg-bg font-body text-ink antialiased">
      <Hero
        onOpenSignUp={onOpenSignUp}
        onOpenBusinessSignUp={handleBusinessCta}
        isAuthenticated={isAuthenticated}
        userRole={user?.role}
      />
    </div>
  );
}
