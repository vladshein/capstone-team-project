import { useState } from "react";
import { Plus, Users, Briefcase, Archive } from "lucide-react";
import { Link } from "react-router-dom";
import type { AuthUser } from "../../redux/auth/types";
import type { CompanyProfile } from "../../redux/companies-profile/types";

interface BusinessDashboardProps {
  user: AuthUser;
  companies: CompanyProfile[];
}

type TabKey = "vacancies" | "workers" | "archive";

const TABS: { key: TabKey; label: string; icon: typeof Briefcase }[] = [
  { key: "vacancies", label: "Мої вакансії", icon: Briefcase },
  { key: "workers", label: "Активні робітники", icon: Users },
  { key: "archive", label: "Архів", icon: Archive },
];

export function BusinessDashboard({ companies }: BusinessDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("vacancies");

  const emptyMessages: Record<TabKey, string> = {
    vacancies: "Ще немає створених змін. Натисніть «Створити зміну», щоб опублікувати першу вакансію.",
    workers: "Наразі немає робітників, закріплених за активними змінами.",
    archive: "Завершені та скасовані зміни з'являться тут.",
  };

  const headerLabel =
    companies.length === 1
      ? companies[0].name
      : `${companies.length} компаній`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-[var(--space-section)] sm:px-6 md:px-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            Кабінет компанії
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {headerLabel}{" "}
            ·{" "}
            <Link to="/profile" className="text-accent-text hover:underline">
              Профіль компанії
            </Link>
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-[var(--radius-pill)] bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover transition-colors">
          <Plus className="h-4 w-4" />
          Створити зміну
        </button>
      </div>

      <div className="rounded-[var(--radius-card)] border border-border bg-bg shadow-sm overflow-hidden">
        <div className="flex border-b border-border">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-medium transition-colors ${
                activeTab === key
                  ? "text-accent border-b-2 border-accent"
                  : "text-text-muted hover:text-text"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="p-5">
          <div className="py-10 text-center text-sm text-text-subtle">
            {emptyMessages[activeTab]}
          </div>
        </div>
      </div>
    </div>
  );
} 
