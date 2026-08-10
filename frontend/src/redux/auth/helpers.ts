import { NAV_LINKS } from "../../constants/navigation.js";
import type { UserRole } from "./types";

const WORKER_CABINET_HREF =
  NAV_LINKS.find((link) => link.id === "nav-worker-cabinet")?.href ?? "/cabinet";
const BUSINESS_CABINET_HREF =
  NAV_LINKS.find((link) => link.id === "nav-business-cabinet")?.href ?? "/dashboard";

export const getDashboardPath = (role: UserRole | undefined): string =>
  role === "business_client" ? BUSINESS_CABINET_HREF : WORKER_CABINET_HREF;

export { WORKER_CABINET_HREF, BUSINESS_CABINET_HREF };
