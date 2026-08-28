import { useState } from "react";
import { LocateFixed, MapPin } from "lucide-react";
import { MapCitySearch, type CityLocation } from "./MapCitySearch"; 

interface SearchFormProps {
  onSearch: (location: CityLocation) => void;
  searchValue: string;
  onSearchValueChange: (value: string) => void;
  cityLabel: string | null;
  isLoadingCity: boolean;
  hasPreciseLocation: boolean;
  isLocating: boolean;
  locationError: string | null;
  onRequestLocation: () => void;
}

export function MapSearchForm({
  onSearch,
  searchValue,
  onSearchValueChange,
  cityLabel,
  isLoadingCity,
  hasPreciseLocation,
  isLocating,
  locationError,
  onRequestLocation,
}: SearchFormProps) {
  const [selectedCity, setSelectedCity] = useState<CityLocation | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); 
    if (!selectedCity) return; // check null
    onSearch(selectedCity);
  };

  return (
    <div className="h-fit rounded-[var(--radius-card)] border border-border bg-bg p-4">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        
        {/* input with city (cyrylic) */}
        <div className="flex-1">
          <MapCitySearch onSelectCity={(location) => setSelectedCity(location)} />
        </div>

        {/* search btn */}
        <button
          type="submit"
          disabled={!selectedCity} // check selection
          className="min-h-[40px] rounded-[var(--radius-card)] bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Пошук
        </button>
      </form>
      <label className="mt-3 block">
        <span className="text-sm font-medium text-text">Пошук змін</span>
        <input
          type="search"
          value={searchValue}
          onChange={(event) => onSearchValueChange(event.target.value)}
          placeholder="Наприклад, бариста або каса"
          className="mt-2 h-10 w-full rounded-[var(--radius-card)] border border-border bg-bg px-3 text-sm text-text outline-none transition-colors placeholder:text-text-subtle focus:border-accent"
        />
        <span className="mt-1 block text-xs text-text-subtle">
          Шукаємо за назвою посади та описом зміни.
        </span>
      </label>
      <div className="mt-4 border-t border-border pt-4">
        <div className="flex items-center gap-2 rounded-[var(--radius-card)] bg-bg-muted px-3 py-2.5 text-sm text-text-muted">
          <MapPin className="h-4 w-4 shrink-0 text-accent" />
          {isLoadingCity
            ? "Визначаємо ваше місто…"
            : cityLabel
              ? `Ваше місто: ${cityLabel}`
              : "Місто не вдалося визначити"}
        </div>
        <button
          type="button"
          onClick={onRequestLocation}
          disabled={isLocating}
          className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[var(--radius-card)] border border-accent/30 bg-accent/10 px-3 text-sm font-medium text-accent-text transition-colors hover:bg-accent/15 disabled:cursor-wait disabled:opacity-60"
        >
          <LocateFixed className="h-4 w-4" />
          {isLocating
            ? "Визначаємо локацію…"
            : hasPreciseLocation
              ? "Точну локацію визначено"
              : "Визначити точну локацію"}
        </button>
        {locationError && <p className="mt-3 text-xs leading-5 text-danger">{locationError}</p>}
      </div>
    </div>
  );
}
