import { useEffect, useMemo, useState, type FormEvent } from "react";
import { MapPin, Plus } from "lucide-react";
import { getCategories, type Category } from "../../api/categories";
import { getJobPositions, type JobPositionOption } from "../../api/positions";
import type { BusinessShift, CreateShiftPayload } from "../../api/shifts";
import { Modal } from "../../components/ui/Modal";
import { companiesProfileService } from "../../services/companiesProfileService";
import type { Location } from "../../redux/companies-profile/types";
import { AddressSearch, type AddressLocation } from "../../components/map/search/AddressSearch";
import { MapPointPicker } from "../../components/map/search/MapPointPicker";
import { TimePicker } from "../../components/ui/TimePicker";

interface CreateShiftModalProps {
  isOpen: boolean;
  companyId: number;
  locations: Location[];
  isSubmitting: boolean;
  serverError?: string | null;
  onClose: () => void;
  onSubmit: (payload: CreateShiftPayload) => Promise<void>;
  onLocationCreated: () => Promise<void>;
  initialShift?: BusinessShift | null;
}

const inputClass =
  "mt-1 min-h-[44px] w-full rounded-[var(--radius-card)] border border-border bg-bg px-3 text-sm outline-none transition-colors focus:border-accent";

// Використовуємо локальну дату, а не UTC із toISOString(): після опівночі
// в Україні UTC ще може показувати вчора, відкриваючи минулу дату в календарі.
const earliestShiftDate = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// У поточній БД тестові посади дублюються для різних міст у форматі
// «Посада (Київ)». Для форми показуємо одну читабельну назву без міста.
const getPositionTitle = (title: string) => title.replace(/\s*\([^)]*\)\s*$/, "").trim();

// Тимчасове зіставлення, доки JobPosition не має власного categoryId.
// Після додавання зв'язку фільтрація має переїхати на бекенд.
const positionTitlesByCategory: Record<number, string[]> = {
  1: ["Продавець-консультант", "Касир торговельного залу", "Касир"],
  2: ["Офіціант", "Кухар-помічник", "Бариста"],
  3: ["Комплектувальник", "Вантажник"],
  4: ["Кур'єр", "Водій-кур'єр"],
  5: ["Прибиральник", "Працівник клінінгу"],
  6: ["Пакувальник", "Оператор виробництва"],
  7: ["Промоутер", "Хостес"],
  8: ["Підсобний робітник", "Монтажник"],
  9: ["Охоронець", "Контролер залу"],
  10: ["Працівник теплиці", "Збирач урожаю"],
  11: ["Оператор кол-центру", "Оператор підтримки", "Адміністратор"],
  12: ["Помічник по дому", "Няня"],
  13: ["Помічник майстра", "Адміністратор салону"],
  14: ["Водій-експедитор", "Працівник автомийки"],
  15: ["Доглядальник за тваринами", "Помічник грумера"],
};

export function CreateShiftModal({
  isOpen,
  companyId,
  locations,
  isSubmitting,
  serverError,
  onClose,
  onSubmit,
  onLocationCreated,
  initialShift = null,
}: CreateShiftModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [positions, setPositions] = useState<JobPositionOption[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isCreatingLocation, setIsCreatingLocation] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [locationId, setLocationId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [positionId, setPositionId] = useState("");
  const [date, setDate] = useState(earliestShiftDate());
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [hourlyRate, setHourlyRate] = useState("");
  const [bonusRate, setBonusRate] = useState("0");
  const [description, setDescription] = useState("");
  const [isNewLocation, setIsNewLocation] = useState(locations.length === 0);
  const [locationTitle, setLocationTitle] = useState("");
  const [locationCity, setLocationCity] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [locationCoordinates, setLocationCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setFormError(null);
    if (initialShift) {
      const start = new Date(initialShift.startTime);
      const end = new Date(initialShift.endTime);
      const initialCategoryId =
        initialShift.Category?.id ?? initialShift.category?.id ?? initialShift.categoryId;
      setIsNewLocation(false);
      setLocationId(String(initialShift.Location.id));
      setCategoryId(initialCategoryId ? String(initialCategoryId) : "");
      setPositionId(String(initialShift.JobPosition?.id ?? initialShift.positionId ?? ""));
      setDate(start.toISOString().slice(0, 10));
      setStartTime(start.toISOString().slice(11, 16));
      setEndTime(end.toISOString().slice(11, 16));
      setHourlyRate(String(initialShift.hourlyRate));
      setBonusRate(String(initialShift.bonusRate));
      setDescription(initialShift.description ?? "");
    } else {
      setIsNewLocation(locations.length === 0);
      if (locations.length > 0) {
        setLocationId((currentLocationId) => currentLocationId || String(locations[0].id));
      }
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
  }, [initialShift, isOpen, locations]);

  const availablePositions = useMemo(() => {
    const categoryPositions = positionTitlesByCategory[Number(categoryId)] ?? [];
    const uniquePositions = new Map<string, JobPositionOption>();

    positions.forEach((position) => {
      const title = getPositionTitle(position.title);
      if (!uniquePositions.has(title)) {
        uniquePositions.set(title, { ...position, title });
      }
    });

    return [...uniquePositions.values()].filter((position) =>
      categoryId ? categoryPositions.includes(position.title) : true,
    );
  }, [categoryId, positions]);

  const canSubmit = useMemo(
    () =>
      !isSubmitting &&
      !isCreatingLocation &&
      !isLoadingOptions &&
      Boolean(categoryId && positionId && hourlyRate) &&
      (isNewLocation ? Boolean(locationCoordinates) : Boolean(locationId)),
    [
      categoryId,
      hourlyRate,
      isCreatingLocation,
      isLoadingOptions,
      isNewLocation,
      isSubmitting,
      locationId,
      locationCoordinates,
      positionId,
    ],
  );

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);
    if (end <= start) end.setDate(end.getDate() + 1);

    if (start <= new Date()) {
      setFormError("Час початку зміни має бути в майбутньому.");
      return;
    }

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
        if (!locationCoordinates) {
          setFormError("Оберіть адресу з підказок, щоб зберегти точку на карті.");
          return;
        }
        setIsCreatingLocation(true);
        const { data } = await companiesProfileService.createCompanyLocation(companyId, {
          title: locationTitle.trim(),
          city: locationCity.trim(),
          address: locationAddress.trim(),
          latitude: locationCoordinates.latitude,
          longitude: locationCoordinates.longitude,
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

  const handleAddressSelect = (location: AddressLocation) => {
    setLocationCity(location.city);
    setLocationAddress(location.address);
    setLocationCoordinates({
      latitude: location.latitude,
      longitude: location.longitude,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialShift ? "Редагувати зміну" : "Створити зміну"}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">
            Категорія
            <select
              value={categoryId}
              onChange={(event) => {
                setCategoryId(event.target.value);
                setPositionId("");
              }}
              className={inputClass}
              disabled={isLoadingOptions}
            >
              <option value="">Оберіть категорію</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">
            Посада
            <select value={positionId} onChange={(event) => setPositionId(event.target.value)} className={inputClass} disabled={isLoadingOptions || !categoryId}>
              <option value="">{categoryId ? "Оберіть посаду" : "Спершу оберіть категорію"}</option>
              {availablePositions.map((position) => <option key={position.id} value={position.id}>{position.title}</option>)}
            </select>
          </label>
        </div>

        <fieldset className="rounded-[var(--radius-card)] border border-border p-4">
          <legend className="px-1 text-sm font-medium">Робоча локація</legend>
          {locations.length > 0 && !initialShift && (
            <label className="flex cursor-pointer items-center gap-2 text-sm text-text-muted">
              <input type="checkbox" checked={isNewLocation} onChange={(event) => setIsNewLocation(event.target.checked)} className="accent-accent" />
              <Plus className="h-4 w-4" />
              Додати нову локацію
            </label>
          )}

          {isNewLocation ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <AddressSearch onSelect={handleAddressSelect} />
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsMapPickerOpen((isOpen) => !isOpen)}
                    className="inline-flex min-h-[36px] items-center gap-1.5 rounded-[var(--radius-pill)] border border-border px-3 text-xs font-medium text-text transition-colors hover:border-accent hover:text-accent-text"
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    {isMapPickerOpen ? "Сховати мапу" : "Вказати точку на мапі"}
                  </button>
                  <p className={`text-xs ${locationCoordinates ? "text-accent-text" : "text-text-subtle"}`}>
                  {locationCoordinates
                    ? "Точку обрано — координати буде збережено для карти."
                    : "Оберіть адресу з підказок або поставте точку на мапі."}
                  </p>
                </div>
                {isMapPickerOpen && (
                  <div className="mt-3">
                    <MapPointPicker value={locationCoordinates} onChange={setLocationCoordinates} />
                  </div>
                )}
              </div>
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
          <label className="text-sm font-medium">Дата<input type="date" min={earliestShiftDate()} value={date} onChange={(event) => setDate(event.target.value)} className={inputClass} /></label>
          <label className="text-sm font-medium">Початок<TimePicker value={startTime} onChange={setStartTime} ariaLabel="Час початку" /></label>
          <label className="text-sm font-medium">Кінець<TimePicker value={endTime} onChange={setEndTime} ariaLabel="Час завершення" /></label>
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
          {isSubmitting || isCreatingLocation ? "Зберігаємо…" : initialShift ? "Зберегти зміни" : "Опублікувати зміну"}
        </button>
      </form>
    </Modal>
  );
}
