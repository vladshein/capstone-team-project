import { Hero } from "../sectionsHero/Hero";
import { useBusinessCta } from "../hooks/useBusinessCta";

interface HomePageProps {
  onOpenSignUp?: () => void;
  onOpenBusinessSignUp?: () => void;
}

export default function HomePage({ onOpenSignUp, onOpenBusinessSignUp }: HomePageProps) {
  const handleBusinessCta = useBusinessCta(onOpenBusinessSignUp);

  return (
    <div className="min-h-screen bg-white font-['Inter'] text-[#12131A] antialiased">
      <Hero onOpenSignUp={onOpenSignUp} onOpenBusinessSignUp={handleBusinessCta} />
    </div>
  );
}
