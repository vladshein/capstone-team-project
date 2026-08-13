import { useEffect, useMemo, useState, type FormEvent } from "react";
import { MapPin, Plus } from "lucide-react";
import { getCategories, type Category } from "../../api/categories";
import { getJobPositions, type JobPositionOption } from "../../api/positions";
import type { CreateShiftPayload } from "../../api/shifts";
import { Modal } from "../../components/ui/Modal";
import { companiesProfileService } from "../../services/companiesProfileService";
import type { Location } from "../../redux/companies-profile/types";

interface CreateShiftModalProps {
  isOpen: boolean;
  companyId: number;
  locations: Location[];
  isSubmitting: boolean;
  serverError?: string | null;
  onClose: () => void;
  onSubmit: (payload: CreateShiftPayload) => Promise<void>;
  onLocationCreated: () => Promise<void>;
}

const inputClass =
  "mt-1 min-h-[44px] w-full rounded-[var(--radius-card)] border border-border bg-bg px-3 text-sm outline-none transition-colors focus:border-accent";

const today = () => new Date().toISOString().slice(0, 10);

export function CreateShiftModal({
  isOpen,
  companyId,
  locations,
  isSubmitting,
  serverError,
  onClose,
  onSubmit,
  onLocationCreated,
}: CreateShiftModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [positions, setPositions] = useState<JobPositionOption[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isCreatingLocation, setIsCreatingLocation] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [locationId, setLocationId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [positionId, setPositionId] = useState("");
  const [date, setDate] = useState(today());
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [hourlyRate, setHourlyRate] = useState("");
  const [bonusRate, setBonusRate] = useState("0");
  const [description, setDescription] = useState("");
  const [isNewLocation, setIsNewLocation] = useState(locations.length === 0);
  const [locationTitle, setLocationTitle] = useState("");
  const [locationCity, setLocationCity] = useState("");
  const [locationAddress, setLocationAddress] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    setFormError(null);
    setIsNewLocation(locations.length === 0);
    if (locations.length > 0) {
      setLocationId((currentLocationId) => currentLocationId || String(locations[0].id));
    }

    let cancelled = false;
    setIsLoadingOptions(true);
    void Promise.all([getCategories(), getJobPositions()])
      .then(([nextCategories, nextPositions]) => {
        if (!cancelled) {
          setCategories(nextCategories);
          setPositions(nextPositions);
        }
      })
      .catch(() => {
        if (!cancelled) setFormError("Не вдалося завантажити посади та категорії.");
      })
      .finally(() => {
        if (!cancelled) setIsLoadingOptions(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, locations]);

  const canSubmit = useMemo(
    () =>
      !isSubmitting &&
      !isCreatingLocation &&
      !isLoadingOptions &&
      Boolean(categoryId && positionId && hourlyRate) &&
      (isNewLocation || Boolean(locationId)),
    [
      categoryId,
      hourlyRate,
      isCreatingLocation,
      isLoadingOptions,
      isNewLocation,
      isSubmitting,
      locationId,
      positionId,
    ],
  );

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);
    if (end <= start) end.setDate(end.getDate() + 1);

    const rate = Number(hourlyRate);
    const bonus = Number(bonusRate || 0);
    if (!Number.isFinite(rate) || rate <= 0) {
      setFormError("Вкажіть погодинну ставку більше нуля.");
      return;
    }
    if (!Number.isFinite(bonus) || bonus < 0) {
      setFormError("Бонус не може бути від’ємним.");
      return;
    }

    let selectedLocationId = Number(locationId);
    try {
      if (isNewLocation) {
        if (!locationTitle.trim() || !locationCity.trim() || !locationAddress.trim()) {
          setFormError("Заповніть назву, місто й адресу робочої локації.");
          return;
        }
        setIsCreatingLocation(true);
        const { data } = await companiesProfileService.createCompanyLocation(companyId, {
          title: locationTitle.trim(),
          city: locationCity.trim(),
          address: locationAddress.trim(),
        });
        selectedLocationId = data.data.id;
        await onLocationCreated();
      }

      await onSubmit({
        locationId: selectedLocationId,
        categoryId: Number(categoryId),
        positionId: Number(positionId),
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        hourlyRate: rate,
        bonusRate: bonus,
        description: description.trim(),
      });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Не вдалося створити зміну.");
    } finally {
      setIsCreatingLocation(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Створити зміну">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">
            Категорія
            <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className={inputClass} disabled={isLoadingOptions}>
              <option value="">Оберіть категорію</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">
            Посада
            <select value={positionId} onChange={(event) => setPositionId(event.target.value)} className={inputClass} disabled={isLoadingOptions}>
              <option value="">Оберіть посаду</option>
              {positions.map((position) => <option key={position.id} value={position.id}>{position.title}</option>)}
            </select>
          </label>
        </div>

        <fieldset className="rounded-[var(--radius-card)] border border-border p-4">
          <legend className="px-1 text-sm font-medium">Робоча локація</legend>
          {locations.length > 0 && (
            <label className="flex cursor-pointer items-center gap-2 text-sm text-text-muted">
              <input type="checkbox" checked={isNewLocation} onChange={(event) => setIsNewLocation(event.target.checked)} className="accent-accent" />
              <Plus className="h-4 w-4" />
              Додати нову локацію
            </label>
          )}

          {isNewLocation ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">Назва точки<input value={locationTitle} onChange={(event) => setLocationTitle(event.target.value)} className={inputClass} placeholder="Напр. Магазин на Подолі" /></label>
              <label className="text-sm font-medium">Місто<input value={locationCity} onChange={(event) => setLocationCity(event.target.value)} className={inputClass} placeholder="Київ" /></label>
              <label className="text-sm font-medium sm:col-span-2">Адреса<input value={locationAddress} onChange={(event) => setLocationAddress(event.target.value)} className={inputClass} placeholder="вул. Хрещатик, 1" /></label>
            </div>
          ) : (
            <label className="mt-3 block text-sm font-medium">
              Оберіть локацію
              <select value={locationId} onChange={(event) => setLocationId(event.target.value)} className={inputClass}>
                {locations.map((location) => <option key={location.id} value={location.id}>{location.title} — {location.city}, {location.address}</option>)}
              </select>
            </label>
          )}
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="text-sm font-medium">Дата<input type="date" min={today()} value={date} onChange={(event) => setDate(event.target.value)} className={inputClass} /></label>
          <label className="text-sm font-medium">Початок<input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className={inputClass} /></label>
          <label className="text-sm font-medium">Кінець<input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} className={inputClass} /></label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">Ставка, ₴/год<input type="number" min="1" step="0.01" value={hourlyRate} onChange={(event) => setHourlyRate(event.target.value)} className={inputClass} placeholder="200" /></label>
          <label className="text-sm font-medium">Бонус, ₴<input type="number" min="0" step="0.01" value={bonusRate} onChange={(event) => setBonusRate(event.target.value)} className={inputClass} /></label>
        </div>

        <label className="block text-sm font-medium">
          Опис завдання <span className="font-normal text-text-subtle">(необов’язково)</span>
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} className={`${inputClass} min-h-24 py-3`} placeholder="Коротко опишіть, що потрібно зробити" />
        </label>

        {(formError || serverError) && <p className="text-sm text-danger">{formError || serverError}</p>}
        <button type="submit" disabled={!canSubmit} className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[var(--radius-pill)] bg-accent px-5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60">
          <MapPin className="h-4 w-4" />
          {isSubmitting || isCreatingLocation ? "Зберігаємо…" : "Опублікувати зміну"}
        </button>
      </form>
    </Modal>
  );
}
