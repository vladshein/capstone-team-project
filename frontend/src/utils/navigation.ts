import { NAV_LINKS, USER_ROLES } from "../constants/navigation";

export function getFilteredNavLinks(
  isAuthenticated: boolean,
  userRole?: string
) {
  const currentRole = isAuthenticated ? userRole : USER_ROLES.GUEST;

  console.log("isAuthenticated:", isAuthenticated, "userRole:", userRole);

  return NAV_LINKS.filter((link) => {
    if (link.authRequired && !isAuthenticated) return false;

    // поки роль не завантажена — не показуємо посилання,
    // які прив'язані до конкретної ролі
    if (link.roles && !currentRole) return false;
    if (link.roles && !link.roles.includes(currentRole)) return false;

    return true;
  });
}