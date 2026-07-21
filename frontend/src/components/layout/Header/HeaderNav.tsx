import { navLinks } from "../../../constants/navigation";

export function HeaderNav() {
  return (
    <nav className="hidden items-center gap-8 md:flex">
      {navLinks.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="text-sm font-medium text-text-muted transition-colors hover:text-accent"
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}
