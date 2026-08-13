import { useEffect, useState } from "react";
import { Building2, ArrowLeft } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { fetchMyCompanies, createCompany, updateCompany } from "../../redux/companies-profile/actions";
import {
  selectCompanies,
  selectCompaniesStatus,
  selectCompaniesError,
} from "../../redux/companies-profile/selectors";
import { CreateCompanyModal, type CreateCompanyPayload } from "./CreateCompanyModal";
import { Loader } from "../../components/ui/Loader";

function ProfileField({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-text-muted">{label}</p>
      <p className={`mt-0.5 text-sm ${value ? "text-ink" : "text-text-subtle italic"}`}>
        {value || "не вказано"}
      </p>
    </div>
  );
}

export function BusinessProfilePage() {
  const dispatch = useAppDispatch();
  const companies = useAppSelector(selectCompanies);
  const status = useAppSelector(selectCompaniesStatus);
  const error = useAppSelector(selectCompaniesError);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    if (status === "idle") {
      void dispatch(fetchMyCompanies());
    }
  }, [status, dispatch]);

  // компанія, що показана в профілі зараз: для 1 — єдина, для >1 — обрана
  const activeCompany =
    companies.length === 1 ? companies[0] : companies.find((c) => c.id === selectedId);

  const openCreateModal = () => {
    setModalMode("create");
    setIsModalOpen(true);
  };

  const openEditModal = () => {
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleCreateCompany = async (payload: CreateCompanyPayload) => {
    setIsSubmitting(true);
    try {
      const created = await dispatch(createCompany(payload)).unwrap();
      setSelectedId(created.id);
      setIsModalOpen(false);
    } catch {
      // помилка (напр. дублікат ЄДРПОУ, 409) вже потрапить у selectCompaniesError
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCompany = async (payload: CreateCompanyPayload) => {
  if (!activeCompany) return;
  setIsSubmitting(true);
  try {
    await dispatch(updateCompany({ id: activeCompany.id, payload })).unwrap();
    setIsModalOpen(false);
  } catch {
  } finally {
    setIsSubmitting(false);
  }
};
  const handleModalSubmit = modalMode === "create" ? handleCreateCompany : handleUpdateCompany;

  if (status === "loading" || status === "idle") {
    return <Loader label="Завантажуємо профіль компанії…" size="lg" fullScreen />;
  }

  if (error) {
    return <p className="p-8 text-center text-sm text-danger">{error.message}</p>;
  }

  if (companies.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-[var(--space-section)] sm:px-6 md:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
              Профіль компанії
            </h1>
            <p className="mt-1 text-sm text-text-muted">Дані ще не заповнено</p>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-[var(--radius-pill)] bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
          >
            <Building2 className="h-4 w-4" />
            Створити компанію
          </button>
        </div>

        <div className="rounded-[var(--radius-card)] border border-border bg-bg p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <ProfileField label="Назва компанії" />
            <ProfileField label="ЄДРПОУ" />
          </div>
          <div className="mt-4">
            <ProfileField label="Юридична адреса" />
          </div>
        </div>

        <CreateCompanyModal
          isOpen={isModalOpen}
          isSubmitting={isSubmitting}
          mode={modalMode}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleModalSubmit}
        />
      </div>
    );
  }

  if (companies.length > 1 && selectedId === null) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-[var(--space-section)] sm:px-6 md:px-8">
        <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl mb-6">
          Оберіть компанію
        </h1>
        <div className="space-y-2">
          {companies.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedId(c.id)}
              className="flex w-full items-center justify-between rounded-[var(--radius-card)] border border-border bg-bg p-4 text-left text-sm hover:border-accent"
            >
              <span className="font-medium">{c.name}</span>
              <span className="text-text-subtle">{c.edrpou}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-[var(--radius-pill)] border border-border px-5 py-2.5 text-sm font-medium hover:border-accent"
          >
            <Building2 className="h-4 w-4" />
            Додати ще одну компанію
          </button>
        </div>

        <CreateCompanyModal
          isOpen={isModalOpen}
          isSubmitting={isSubmitting}
          mode={modalMode}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleModalSubmit}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-[var(--space-section)] sm:px-6 md:px-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          {companies.length > 1 && (
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="mb-2 flex items-center gap-1 text-xs text-text-muted hover:text-ink"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              До списку компаній
            </button>
          )}
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            Профіль компанії
          </h1>
          <p className="mt-1 text-sm text-text-muted">Дані вашої компанії</p>
        </div>
        <button
          type="button"
          onClick={openEditModal}
          className="flex items-center gap-2 rounded-[var(--radius-pill)] bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
        >
          <Building2 className="h-4 w-4" />
          Редагувати компанію
        </button>
      </div>

      <div className="rounded-[var(--radius-card)] border border-border bg-bg p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <ProfileField label="Назва компанії" value={activeCompany?.name} />
          <ProfileField label="ЄДРПОУ" value={activeCompany?.edrpou} />
        </div>
        <div className="mt-4">
          <ProfileField label="Юридична адреса" value={activeCompany?.legalAddress} />
        </div>
      </div>

      <CreateCompanyModal
        isOpen={isModalOpen}
        isSubmitting={isSubmitting}
        mode={modalMode}
        initialValues={
          modalMode === "edit" && activeCompany
            ? {
                name: activeCompany.name,
                edrpou: activeCompany.edrpou,
                legalAddress: activeCompany.legalAddress,
              }
            : undefined
        }
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
}

export default BusinessProfilePage;