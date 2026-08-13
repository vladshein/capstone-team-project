import { useEffect, useState } from "react";
import {
  Archive,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardList,
  MapPin,
  Plus,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { fetchMyCompanies } from "../../redux/companies-profile/actions";
import {
  selectCompanies,
  selectCompaniesStatus,
} from "../../redux/companies-profile/selectors";
import { Loader } from "../../components/ui/Loader";
import { CreateShiftModal } from "./CreateShiftModal";
import { createNewShift } from "../../redux/shift/actions";
import { clearShiftError } from "../../redux/shift/slice";
import type { CreateShiftPayload } from "../../api/shifts";
import { getBusinessShifts, type BusinessShift } from "../../api/shifts";

type BusinessTab = "shifts" | "applications" | "archive";

const tabs: { id: BusinessTab; label: string; Icon: typeof BriefcaseBusiness }[] = [
  { id: "shifts", label: "Мої зміни", Icon: BriefcaseBusiness },
  { id: "applications", label: "Заявки", Icon: Users },
  { id: "archive", label: "Архів", Icon: Archive },
];

const emptyState: Record<BusinessTab, { title: string; description: string }> = {
  shifts: {
    title: "Ще немає створених змін",
    description: "Створіть першу зміну, щоб знайти виконавця для вашої компанії.",
  },
  applications: {
    title: "Поки немає заявок",
    description: "Відгуки виконавців з'являться тут після публікації зміни.",
  },
  archive: {
    title: "Архів поки порожній",
    description: "Завершені та скасовані зміни з'являться тут.",
  },
};

function BusinessDashboardPage() {
  const dispatch = useAppDispatch();
  const companies = useAppSelector(selectCompanies);
  const status = useAppSelector(selectCompaniesStatus);
  const [activeTab, setActiveTab] = useState<BusinessTab>("shifts");
  const [activeCompanyId, setActiveCompanyId] = useState<number | null>(null);
  const [isCreateShiftOpen, setIsCreateShiftOpen] = useState(false);
  const [businessShifts, setBusinessShifts] = useState<BusinessShift[]>([]);
  const [isLoadingShifts, setIsLoadingShifts] = useState(false);
  const [shiftsError, setShiftsError] = useState<string | null>(null);
  const isCreatingShift = useAppSelector((state) => state.shift.isCreating);
  const shiftError = useAppSelector((state) => state.shift.error);

  useEffect(() => {
    if (status === "idle") void dispatch(fetchMyCompanies());
  }, [dispatch, status]);

  useEffect(() => {
    if (activeCompanyId === null && companies.length > 0) {
      setActiveCompanyId(companies[0].id);
    }
  }, [activeCompanyId, companies]);

  useEffect(() => {
    if (activeCompanyId === null || activeTab === "applications") return;

    let cancelled = false;
    setIsLoadingShifts(true);
    setShiftsError(null);
    void getBusinessShifts(activeCompanyId, activeTab === "archive" ? "archive" : "active")
      .then((shifts) => {
        if (!cancelled) setBusinessShifts(shifts);
      })
      .catch((error) => {
        if (!cancelled) {
          setShiftsError(error instanceof Error ? error.message : "Не вдалося завантажити зміни.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingShifts(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeCompanyId, activeTab]);

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
          <Link
            to="/profile"
            state={{ openCreate: true }}
            className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-[var(--radius-pill)] bg-accent px-5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            <Plus className="h-4 w-4" />
            Створити компанію
          </Link>
        </div>
      </section>
    );
  }

  const activeCompany =
    companies.find((company) => company.id === activeCompanyId) ?? companies[0];
  const currentEmptyState = emptyState[activeTab];

  const openCreateShift = () => {
    dispatch(clearShiftError());
    setIsCreateShiftOpen(true);
  };

  const handleCreateShift = async (payload: CreateShiftPayload) => {
    await dispatch(createNewShift(payload)).unwrap();
    setIsCreateShiftOpen(false);
    setActiveTab("shifts");
    const shifts = await getBusinessShifts(activeCompany.id, "active");
    setBusinessShifts(shifts);
  };

  const refreshCompanyLocations = async () => {
    // Після створення нової точки оновлюємо кеш компаній, щоб вона була
    // доступна у наступній формі без оновлення сторінки.
    await dispatch(fetchMyCompanies()).unwrap();
  };

  const formatSchedule = (shift: BusinessShift) => {
    const date = new Date(shift.startTime);
    const dateLabel = date.toLocaleDateString("uk-UA", {
      day: "numeric",
      month: "long",
    });
    const start = date.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" });
    const end = new Date(shift.endTime).toLocaleTimeString("uk-UA", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${dateLabel} · ${start}–${end}`;
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-[var(--space-section)] sm:px-6 md:px-8">
      <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            Кабінет компанії
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-text-muted">
            {companies.length === 1 ? (
              <span>{activeCompany.name}</span>
            ) : (
              <label className="flex items-center gap-2">
                <span className="sr-only">Активна компанія</span>
                <select
                  value={activeCompany.id}
                  onChange={(event) => setActiveCompanyId(Number(event.target.value))}
                  className="cursor-pointer appearance-none bg-transparent pr-6 font-medium text-text outline-none hover:text-accent"
                >
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <span aria-hidden="true">·</span>
            <Link
              to="/profile"
              state={{ companyId: activeCompany.id }}
              className="text-accent-text hover:underline"
            >
              Профіль компанії
            </Link>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreateShift}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[var(--radius-pill)] bg-accent px-5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          <Plus className="h-4 w-4" />
          Створити зміну
        </button>
      </header>

      <div className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-bg shadow-sm">
        <div className="flex overflow-x-auto border-b border-border px-1">
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-4 text-sm font-medium transition-colors sm:px-5 ${
                activeTab === id
                  ? "border-accent text-accent"
                  : "border-transparent text-text-muted hover:text-text"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {activeTab !== "applications" && businessShifts.length > 0 ? (
          <div className="divide-y divide-border">
            {businessShifts.map((shift) => (
              <article key={shift.id} className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-heading font-semibold">{shift.JobPosition.title}</p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-text-muted">
                    <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{formatSchedule(shift)}</span>
                    <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{shift.Location.title}, {shift.Location.city}</span>
                  </div>
                </div>
                <span className={`w-fit rounded-[var(--radius-pill)] px-3 py-1 text-xs font-medium ${shift.status === "open" ? "bg-accent/10 text-accent-text" : "bg-bg-muted text-text-muted"}`}>
                  {shift.status === "open" ? "Відкрита" : shift.status}
                </span>
              </article>
            ))}
          </div>
        ) : (
          <div className="flex min-h-52 flex-col items-center justify-center px-6 py-10 text-center">
            <ClipboardList className="h-8 w-8 text-accent/80" />
            <h2 className="mt-4 font-heading text-lg font-semibold">
              {isLoadingShifts ? "Завантажуємо зміни…" : currentEmptyState.title}
            </h2>
            <p className="mt-2 max-w-md text-sm text-text-muted">
              {shiftsError ?? currentEmptyState.description}
            </p>
          </div>
        )}
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
