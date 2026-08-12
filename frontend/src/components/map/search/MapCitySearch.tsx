import { useState, useEffect, useRef } from "react";

export interface CityLocation {
  name: string;
  lat: number;
  lng: number;
  bbox?: [[number, number], [number, number]]; // [[south, west], [north, east]]
}

interface CitySearchProps {
  onSelectCity: (location: CityLocation) => void;
}

export function MapCitySearch({ onSelectCity }: CitySearchProps) {
  const [query, setQuery] = useState("");
  // array of CityLocation
  const [suggestions, setSuggestions] = useState<CityLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close list when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch with debounce (300ms)
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query
          )}&countrycodes=ua&addressdetails=1&accept-language=uk&limit=10`
        );

        const data = await response.json();

        // Фільтруємо: міста та містечка (якщо потрібні й села — додайте || type === "village")
        const filteredCities = data.filter((item: any) => {
          const type = item.addresstype || item.type;
          return type === "city" || type === "town"; 
        });

        // 2. create CityLocation
        const cityLocations: CityLocation[] = filteredCities.map((item: any) => {
          const cityName =
            item.address?.city ||
            item.address?.town ||
            item.display_name.split(",")[0].trim();

          return {
            name: cityName,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            bbox: item.boundingbox
              ? [
                  [parseFloat(item.boundingbox[0]), parseFloat(item.boundingbox[2])], // South-West
                  [parseFloat(item.boundingbox[1]), parseFloat(item.boundingbox[3])], // North-East
                ]
              : undefined,
          };
        });

        // remove duplicate
        const uniqueCities = cityLocations.filter(
          (city, index, self) =>
            index === self.findIndex((c) => c.name === city.name)
        );

        setSuggestions(uniqueCities);
        setIsOpen(uniqueCities.length > 0);
      } catch (error) {
        console.error("Помилка завантаження міст:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // CityLocation pass up
  const handleSelect = (location: CityLocation) => {
    setQuery(location.name);
    setIsOpen(false);
    onSelectCity(location);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Мала Токмачка"
          className="w-full rounded-[var(--radius-card)] border border-border bg-bg px-3 py-2 text-sm outline-none placeholder:text-text-subtle focus:border-accent"
        />
        {isLoading && (
          <span className="absolute right-3 top-2.5 text-xs text-text-muted">
            ...
          </span>
        )}
      </div>

      {isOpen && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-[var(--radius-card)] border border-border bg-bg py-1 shadow-lg">
          {suggestions.map((cityLoc, index) => (
            <li
              key={index}
              onClick={() => handleSelect(cityLoc)}
              className="cursor-pointer px-3 py-2 text-sm transition-colors hover:bg-bg-muted"
            >
              {cityLoc.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}