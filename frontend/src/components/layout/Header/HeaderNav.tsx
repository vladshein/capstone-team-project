import { useNavLinks } from "../../../hooks/useNavLinks";

export function HeaderNav() {
  const links = useNavLinks();
  
  return (
    <nav className="hidden items-center gap-8 md:flex">
      {links.map((link) => (
        <a
          key={link.id}
          href={link.href}
          className="text-sm font-medium text-text-muted transition-colors hover:text-accent"
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}
