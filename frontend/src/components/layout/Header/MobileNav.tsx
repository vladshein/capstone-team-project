import { useNavLinks } from "../../../hooks/useNavLinks";

export function MobileNav() {
  const links = useNavLinks();

  return (
    <nav className="mt-6 flex flex-col gap-1 sm:mt-8 sm:gap-2">
      {links.map((link) => (
        <a
          key={link.id}
          href={link.href}
          className="flex min-h-[44px] items-center text-base font-medium text-ink"
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}
