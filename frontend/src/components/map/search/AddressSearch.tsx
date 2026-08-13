import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";

export interface AddressLocation {
  city: string;
  address: string;
  label: string;
  latitude: number;
  longitude: number;
}

interface NominatimAddress {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    road?: string;
    house_number?: string;
  };
}

interface AddressSearchProps {
  onSelect: (location: AddressLocation) => void;
}

/**
 * Адресний пошук для робочих локацій. Використовує той самий Nominatim,
 * що й пошук міст на головній сторінці, але повертає також координати точки.
 */
export function AddressSearch({ onSelect }: AddressSearchProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<AddressLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      setIsLoading(true);
      const params = new URLSearchParams({
        format: "jsonv2",
        q: query.trim(),
        countrycodes: "ua",
        addressdetails: "1",
        "accept-language": "uk",
        limit: "6",
      });

      void fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) throw new Error("Address search failed");
          return (await response.json()) as NominatimAddress[];
        })
        .then((results) => {
          const nextSuggestions = results
            .map((result): AddressLocation | null => {
              const latitude = Number(result.lat);
              const longitude = Number(result.lon);
              const city =
                result.address?.city ??
                result.address?.town ??
                result.address?.village ??
                result.address?.municipality ??
                "";

              if (!city || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
                return null;
              }

              const street = [result.address?.road, result.address?.house_number]
                .filter(Boolean)
                .join(", ");

              return {
                city,
                address: street || result.display_name,
                label: result.display_name,
                latitude,
                longitude,
              };
            })
            .filter((location): location is AddressLocation => location !== null);

          setSuggestions(nextSuggestions);
          setIsOpen(nextSuggestions.length > 0);
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
          setSuggestions([]);
          setIsOpen(false);
        })
        .finally(() => setIsLoading(false));
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query]);

  const selectAddress = (location: AddressLocation) => {
    setQuery(location.label);
    setIsOpen(false);
    onSelect(location);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-sm font-medium">
        Знайти адресу на карті
        <div className="relative mt-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Київ, вул. Хрещатик, 1"
            className="min-h-[44px] w-full rounded-[var(--radius-card)] border border-border bg-bg py-2 pl-10 pr-10 text-sm outline-none transition-colors placeholder:text-text-subtle focus:border-accent"
          />
          {isLoading && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">…</span>}
        </div>
      </label>

      {isOpen && (
        <ul className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-[var(--radius-card)] border border-border bg-bg py-1 shadow-lg">
          {suggestions.map((location) => (
            <li key={`${location.latitude}-${location.longitude}`}>
              <button
                type="button"
                onClick={() => selectAddress(location)}
                className="w-full px-3 py-2 text-left text-sm text-text transition-colors hover:bg-bg-muted"
              >
                {location.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
