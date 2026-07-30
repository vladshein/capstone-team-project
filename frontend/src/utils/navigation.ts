import { NAV_LINKS, USER_ROLES } from "../constants/navigation";

export function getFilteredNavLinks(
  isAuthenticated: boolean,
  userRole?: string
) {
  const currentRole = isAuthenticated
    ? userRole || USER_ROLES.WORKER
    : USER_ROLES.GUEST;

  return NAV_LINKS.filter((link) => {
    if (link.authRequired && !isAuthenticated) return false;

    if (link.roles && !link.roles.includes(currentRole)) return false;

    return true;
  });
}