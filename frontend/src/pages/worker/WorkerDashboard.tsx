import React, { useState } from "react";
import {
  Star,
  MapPin,
  Calendar,
  Clock,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  Gift,
  BellRing,
} from "lucide-react";
import type { AuthUser } from "../../redux/auth/types";

/* ---------------------------------------------------------------------- */
/*  Types — узгоджені з Backend_TZ (GET /verification-status,             */
/*  GET /engagement/bonuses, GET /shifts/my-calendar,                     */
/*  POST /shifts/:id/confirm-attendance). Фінансовий блок (баланс,        */
/*  cash-out, історія виплат) прибрано — ці ендпоінти поза поточним       */
/*  скоупом застарілого ТЗ.                                               */
/* ---------------------------------------------------------------------- */

type VerificationState = "verified" | "pending" | "none";

export interface VerificationStatus {
  diia: VerificationState;
  passport: VerificationState;
  selfie: VerificationState;
  tax: VerificationState;
  medical: VerificationState;
}

export interface Bonus {
  milestoneId: number;
  title: string;
  progressPercent: number;
  currentCount: number;
  targetCount: number;
}

export interface UpcomingShift {
  id: string;
  position: string;
  companyName: string;
  address: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "Booked" | "Active";
  isAttendanceConfirmed: boolean;
  /** true, коли до старту зміни лишилось ≤3 години і вікно підтвердження відкрите */
  attendanceConfirmationOpen: boolean;
}

interface WorkerDashboardProps {
  user: AuthUser;
  workerProfile: {
    firstName: string;
    lastName: string;
    rating: number;
    taxNumber: string;
    verification: VerificationStatus;
  };
  upcomingShift?: UpcomingShift | null;
  bonuses?: Bonus[];
  onConfirmAttendance?: (shiftId: string) => void;
}

type TabKey = "search" | "bookings";

const TABS: { key: TabKey; label: string }[] = [
  { key: "search", label: "Пошук змін" },
  { key: "bookings", label: "Мої бронювання" },
];

/* ---------------------------------------------------------------------- */
/*  Верифікація — індикатор зелений/жовтий/сірий, як прописано в ТЗ       */
/*  (GET /api/v1/profile/verification-status)                             */
/* ---------------------------------------------------------------------- */

const VERIFICATION_LABELS: Record<keyof VerificationStatus, string> = {
  diia: "Дія",
  passport: "Паспорт",
  selfie: "Селфі-звірка",
  tax: "ФОП / податки",
  medical: "Медкнижка",
};

function VerificationRow({
  label,
  state,
}: {
  label: string;
  state: VerificationState;
}) {
  const config: Record<
    VerificationState,
    { icon: React.ReactNode; text: string; textClass: string }
  > = {
    verified: {
      icon: <ShieldCheck className="h-4 w-4 text-emerald-500" />,
      text: "Підтверджено",
      textClass: "text-emerald-600",
    },
    pending: {
      icon: <ShieldQuestion className="h-4 w-4 text-warning" />,
      text: "На перевірці",
      textClass: "text-warning",
    },
    none: {
      icon: <ShieldAlert className="h-4 w-4 text-text-subtle" />,
      text: "Не пройдено",
      textClass: "text-text-subtle",
    },
  };
  const { icon, text, textClass } = config[state];

  return (
    <li className="flex items-center justify-between py-1.5 text-sm">
      <span className="flex items-center gap-2 text-text">
        {icon}
        {label}
      </span>
      <span className={`text-xs font-medium ${textClass}`}>{text}</span>
    </li>
  );
}

/* ---------------------------------------------------------------------- */
/*  Основний компонент                                                    */
/* ---------------------------------------------------------------------- */

export function WorkerDashboard({
  workerProfile,
  upcomingShift,
  bonuses = [],
  onConfirmAttendance,
}: WorkerDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("bookings");

  const fullName =
    workerProfile.firstName || workerProfile.lastName
      ? `${workerProfile.firstName} ${workerProfile.lastName}`.trim()
      : "Ім'я не вказано";

  return (
    <div className="mx-auto max-w-5xl px-4 py-[var(--space-section)] sm:px-6 md:px-8">
      <div className="flex flex-col gap-8 md:flex-row">
        {/* ---------------------------------------------------------- */}
        {/* Sidebar: профіль, верифікація, бонуси                      */}
        {/* ---------------------------------------------------------- */}
        <aside className="w-full shrink-0 space-y-6 md:w-72">
          {/* Профіль */}
          <div className="rounded-[var(--radius-card)] border border-border bg-bg p-6 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent/10 text-2xl font-bold text-accent">
              {(workerProfile.firstName.charAt(0) || "") +
                (workerProfile.lastName.charAt(0) || "") || "—"}
            </div>
            <h2 className="mt-4 font-heading text-xl font-semibold">
              {fullName}
            </h2>
            <div className="mt-2 flex items-center justify-center gap-1 text-sm font-medium text-text">
              <Star className="h-4 w-4 fill-highlight text-highlight" />
              <span>{workerProfile.rating.toFixed(2)}</span>
            </div>
          </div>

          {/* Верифікація (Identity & Auth) */}
          <div className="rounded-[var(--radius-card)] border border-border bg-bg p-5 shadow-sm">
            <h3 className="font-heading text-sm font-bold uppercase tracking-wide text-text-muted">
              Верифікація
            </h3>
            <ul className="mt-2 divide-y divide-border">
              {(Object.keys(VERIFICATION_LABELS) as (keyof VerificationStatus)[]).map(
                (key) => (
                  <VerificationRow
                    key={key}
                    label={VERIFICATION_LABELS[key]}
                    state={workerProfile.verification[key]}
                  />
                ),
              )}
            </ul>
            {workerProfile.taxNumber && (
              <p className="mt-3 text-xs text-text-subtle">
                ІПН: {workerProfile.taxNumber}
              </p>
            )}
          </div>

          {/* Бонуси / гейміфікація (GET /engagement/bonuses) */}
          {bonuses.length > 0 && (
            <div className="rounded-[var(--radius-card)] border border-border bg-bg p-5 shadow-sm">
              <h3 className="flex items-center gap-2 font-heading text-sm font-bold uppercase tracking-wide text-text-muted">
                <Gift className="h-4 w-4 text-accent" />
                Бонуси
              </h3>
              <div className="mt-3 space-y-4">
                {bonuses.map((bonus) => (
                  <div key={bonus.milestoneId}>
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="font-medium text-ink">
                        {bonus.title}
                      </span>
                      <span className="text-xs text-text-subtle">
                        {bonus.currentCount}/{bonus.targetCount}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-bg-muted">
                      <div
                        className="h-full rounded-full bg-accent transition-all"
                        style={{ width: `${Math.min(bonus.progressPercent, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* ---------------------------------------------------------- */}
        {/* Main content                                                */}
        {/* ---------------------------------------------------------- */}
        <main className="flex-1 space-y-6">
          {/* Наступна зміна + підтвердження виходу (confirm-attendance) */}
          {upcomingShift && (
            <section>
              <h3 className="font-heading text-lg font-bold">
                Наступна зміна
              </h3>
              <div className="mt-4 rounded-[var(--radius-card)] border border-border bg-bg p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-medium text-ink">
                      {upcomingShift.position} · {upcomingShift.companyName}
                    </h4>
                    <p className="mt-1 flex items-center gap-2 text-sm text-text-muted">
                      <MapPin className="h-4 w-4" /> {upcomingShift.address}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent-text">
                    {upcomingShift.status === "Active"
                      ? "Триває"
                      : "Підтверджено"}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-text">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-text-subtle" />{" "}
                    {upcomingShift.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-text-subtle" />{" "}
                    {upcomingShift.startTime} - {upcomingShift.endTime}
                  </span>
                </div>

                {/* Вікно підтвердження виходу відкривається за 3 год до старту */}
                {upcomingShift.attendanceConfirmationOpen &&
                  !upcomingShift.isAttendanceConfirmed && (
                    <div className="mt-4 flex items-center justify-between gap-3 rounded-[var(--radius-card)] bg-warning/10 p-3">
                      <span className="flex items-center gap-2 text-sm text-ink">
                        <BellRing className="h-4 w-4 text-warning" />
                        Підтвердіть, що вийдете на цю зміну
                      </span>
                      <button
                        type="button"
                        onClick={() => onConfirmAttendance?.(upcomingShift.id)}
                        className="shrink-0 rounded-[var(--radius-pill)] bg-warning px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:opacity-90"
                      >
                        Підтвердити
                      </button>
                    </div>
                  )}
              </div>
            </section>
          )}

          {/* Вкладки: Пошук змін / Мої бронювання */}
          <section>
            <div className="flex gap-1 border-b border-border">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? "border-b-2 border-accent text-accent-text"
                      : "text-text-muted hover:text-ink"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-[var(--radius-card)] border border-border bg-bg shadow-sm">
              {activeTab === "search" && <SearchShiftsTab />}
              {activeTab === "bookings" && (
                <BookingsTab upcomingShift={upcomingShift} />
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  Вкладки                                                                */
/* ---------------------------------------------------------------------- */

function SearchShiftsTab() {
  // TODO: підʼєднати GET /api/v1/shifts (гео-пошук) + ShiftCard/ShiftsMapViewer
  // замість заглушки нижче, коли буде готовий /shifts список у сторінці Біржі змін.
  return (
    <div className="flex flex-col items-center gap-2 p-8 text-center text-sm text-text-subtle">
      <p>Тут зʼявиться швидкий пошук змін поруч із вами.</p>
      <a
        href="/shifts"
        className="font-medium text-accent-text hover:underline"
      >
        Перейти до біржі змін →
      </a>
    </div>
  );
}

function BookingsTab({
  upcomingShift,
}: {
  upcomingShift?: UpcomingShift | null;
}) {
  // TODO: підʼєднати GET /api/v1/shifts/my-calendar для повного списку бронювань,
  // не тільки найближчої зміни.
  if (!upcomingShift) {
    return (
      <div className="flex items-center justify-center p-8 text-sm text-text-subtle">
        Активних бронювань поки немає. Час взяти першу зміну!
      </div>
    );
  }
  return (
    <div className="divide-y divide-border">
      <div className="flex items-center justify-between p-4">
        <div>
          <p className="font-medium text-ink">
            {upcomingShift.position} · {upcomingShift.companyName}
          </p>
          <p className="text-sm text-text-muted">
            {upcomingShift.date}, {upcomingShift.startTime}–
            {upcomingShift.endTime}
          </p>
        </div>
        <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent-text">
          {upcomingShift.status === "Active" ? "Триває" : "Заброньовано"}
        </span>
      </div>
    </div>
  );
}