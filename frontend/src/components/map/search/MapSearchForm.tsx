import { useState } from "react";
import { MapCitySearch, type CityLocation } from "./MapCitySearch"; 

interface SearchFormProps {
  onSearch: (location: CityLocation) => void; 
}

export function MapSearchForm({ onSearch }: SearchFormProps) {
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
    </div>
  );
}