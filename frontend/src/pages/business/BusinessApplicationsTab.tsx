import { useEffect, useState } from "react";
import { CalendarDays, ClipboardList, MapPin, Star } from "lucide-react";
import { useOutletContext } from "react-router-dom";

import { getBusinessShiftApplications, type BusinessShiftApplication } from "../../api/shifts";
import { Loader } from "../../components/ui/Loader";
import type { BusinessDashboardOutletContext } from "./BusinessDashboardPage";

export function BusinessApplicationsTab() {
  const { company } = useOutletContext<BusinessDashboardOutletContext>();
  const [applications, setApplications] = useState<BusinessShiftApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    void getBusinessShiftApplications(company.id)
      .then((data) => { if (!cancelled) setApplications(data); })
      .catch((requestError) => {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : "Не вдалося завантажити заявки.");
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [company.id]);

  if (isLoading) return <Loader label="Завантажуємо заявки…" />;
  if (applications.length === 0) {
    return (
      <div className="flex min-h-52 flex-col items-center justify-center px-6 py-10 text-center">
        <ClipboardList className="h-8 w-8 text-accent/80" />
        <h2 className="mt-4 font-heading text-lg font-semibold">Поки немає заявок</h2>
        <p className="mt-2 max-w-md text-sm text-text-muted">{error ?? "Відгуки виконавців з'являться тут після публікації зміни."}</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {applications.map((application) => {
        const profile = application.User.WorkerProfile;
        const workerName = profile ? `${profile.firstName} ${profile.lastName}` : "Виконавець";
        const schedule = new Date(application.Shift.startTime).toLocaleString("uk-UA", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
        const isApproved = application.status === "approved";

        return (
          <article key={application.id} className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-heading font-semibold">{workerName}</p>
                <span className={`rounded-[var(--radius-pill)] px-3 py-1 text-xs font-medium ${isApproved ? "bg-accent/10 text-accent-text" : "bg-warning/10 text-warning"}`}>{isApproved ? "Підтверджено" : "Нова заявка"}</span>
              </div>
              <p className="mt-1 text-sm text-text-muted">На зміну: {application.Shift.JobPosition.title}</p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-text-muted">
                <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{schedule}</span>
                <span className="flex items-center gap-1.5"><Star className="h-4 w-4" />Рейтинг: {profile?.rating ?? "—"}</span>
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{application.Shift.Location.city}, {application.Shift.Location.address}</span>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
