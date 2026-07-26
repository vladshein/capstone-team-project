import { navLinks } from "../../../constants/navigation";

interface MobileNavProps {
  onClose: () => void;
}

export function MobileNav({ onClose }: MobileNavProps) {
  return (
    <nav className="mt-6 flex flex-col gap-1 sm:mt-8 sm:gap-2">
      {navLinks.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="flex min-h-[44px] items-center text-base font-medium text-ink"
          onClick={onClose}
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}
