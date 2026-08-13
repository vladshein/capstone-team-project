import { useEffect, useState } from "react";
import { Archive, BriefcaseBusiness, Plus, Users } from "lucide-react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";

import { Loader } from "../../components/ui/Loader";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { fetchMyCompanies } from "../../redux/companies-profile/actions";
import {
  selectCompanies,
  selectCompaniesStatus,
} from "../../redux/companies-profile/selectors";
import type { CompanyProfile } from "../../redux/companies-profile/types";
import { createNewShift } from "../../redux/shift/actions";
import { clearShiftError } from "../../redux/shift/slice";
import type { CreateShiftPayload } from "../../api/shifts";
import { CreateShiftModal } from "./CreateShiftModal";

export interface BusinessDashboardOutletContext {
  company: CompanyProfile;
  shiftsRefreshKey: number;
}

const tabs = [
  { to: "shifts", label: "Мої зміни", Icon: BriefcaseBusiness },
  { to: "applications", label: "Заявки", Icon: Users },
  { to: "archive", label: "Архів", Icon: Archive },
];

function BusinessDashboardPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const companies = useAppSelector(selectCompanies);
  const status = useAppSelector(selectCompaniesStatus);
  const isCreatingShift = useAppSelector((state) => state.shift.isCreating);
  const shiftError = useAppSelector((state) => state.shift.error);
  const [activeCompanyId, setActiveCompanyId] = useState<number | null>(null);
  const [isCreateShiftOpen, setIsCreateShiftOpen] = useState(false);
  const [shiftsRefreshKey, setShiftsRefreshKey] = useState(0);

  useEffect(() => {
    if (status === "idle") void dispatch(fetchMyCompanies());
  }, [dispatch, status]);

  useEffect(() => {
    if (activeCompanyId === null && companies.length > 0) {
      setActiveCompanyId(companies[0].id);
    }
  }, [activeCompanyId, companies]);

  if (status === "loading" || status === "idle") {
    return <Loader label="Завантажуємо кабінет…" size="lg" fullScreen />;
  }

  if (companies.length === 0) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-[var(--space-section)] sm:px-6 md:px-8">
        <div className="rounded-[var(--radius-card)] border border-border bg-bg p-8 text-center shadow-sm">
          <BriefcaseBusiness className="mx-auto h-9 w-9 text-accent" />
          <h1 className="mt-4 font-heading text-2xl font-bold">Кабінет компанії</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-text-muted">
            Спершу створіть профіль компанії — тоді зможете публікувати зміни й отримувати заявки.
          </p>
          <Link to="/profile" state={{ openCreate: true }} className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-[var(--radius-pill)] bg-accent px-5 text-sm font-medium text-white transition-colors hover:bg-accent-hover">
            <Plus className="h-4 w-4" />
            Створити компанію
          </Link>
        </div>
      </section>
    );
  }

  const activeCompany = companies.find((company) => company.id === activeCompanyId) ?? companies[0];

  const handleCreateShift = async (payload: CreateShiftPayload) => {
    await dispatch(createNewShift(payload)).unwrap();
    setIsCreateShiftOpen(false);
    setShiftsRefreshKey((key) => key + 1);
    navigate("/dashboard/shifts");
  };

  const refreshCompanyLocations = async () => {
    await dispatch(fetchMyCompanies()).unwrap();
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-[var(--space-section)] sm:px-6 md:px-8">
      <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Кабінет компанії</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-text-muted">
            {companies.length === 1 ? (
              <span>{activeCompany.name}</span>
            ) : (
              <label className="flex items-center gap-2">
                <span className="sr-only">Активна компанія</span>
                <select value={activeCompany.id} onChange={(event) => setActiveCompanyId(Number(event.target.value))} className="cursor-pointer appearance-none bg-transparent pr-6 font-medium text-text outline-none hover:text-accent">
                  {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
                </select>
              </label>
            )}
            <span aria-hidden="true">·</span>
            <Link to="/profile" state={{ companyId: activeCompany.id }} className="text-accent-text hover:underline">Профіль компанії</Link>
          </div>
        </div>

        <button type="button" onClick={() => { dispatch(clearShiftError()); setIsCreateShiftOpen(true); }} className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[var(--radius-pill)] bg-accent px-5 text-sm font-medium text-white transition-colors hover:bg-accent-hover">
          <Plus className="h-4 w-4" />
          Створити зміну
        </button>
      </header>

      <div className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-bg shadow-sm">
        <nav className="flex overflow-x-auto border-b border-border px-1" aria-label="Розділи кабінету компанії">
          {tabs.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `flex shrink-0 items-center gap-2 border-b-2 px-4 py-4 text-sm font-medium transition-colors sm:px-5 ${isActive ? "border-accent text-accent" : "border-transparent text-text-muted hover:text-text"}`}>
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <Outlet context={{ company: activeCompany, shiftsRefreshKey } satisfies BusinessDashboardOutletContext} />
      </div>

      <CreateShiftModal
        isOpen={isCreateShiftOpen}
        companyId={activeCompany.id}
        locations={activeCompany.Locations ?? []}
        isSubmitting={isCreatingShift}
        serverError={shiftError}
        onClose={() => setIsCreateShiftOpen(false)}
        onSubmit={handleCreateShift}
        onLocationCreated={refreshCompanyLocations}
      />
    </section>
  );
}

export default BusinessDashboardPage;
