import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapPointPickerProps {
  value: { latitude: number; longitude: number } | null;
  onChange: (point: { latitude: number; longitude: number }) => void;
}

// Невелика мапа для ручного вибору координат нової робочої локації.
export function MapPointPicker({ value, onChange }: MapPointPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialPoint: L.LatLngExpression = value
      ? [value.latitude, value.longitude]
      : [50.4501, 30.5234];
    const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView(initialPoint, value ? 15 : 11);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
    }).addTo(map);

    map.on("click", (event: L.LeafletMouseEvent) => {
      onChange({ latitude: event.latlng.lat, longitude: event.latlng.lng });
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [onChange]);

  useEffect(() => {
    if (!mapRef.current || !value) return;

    const point: L.LatLngExpression = [value.latitude, value.longitude];
    if (!markerRef.current) {
      markerRef.current = L.circleMarker(point, {
        radius: 9,
        fillColor: "#10b981",
        color: "#ffffff",
        weight: 3,
        fillOpacity: 1,
      }).addTo(mapRef.current);
    } else {
      markerRef.current.setLatLng(point);
    }
  }, [value]);

  return (
    <div>
      <p className="mb-2 text-xs text-text-muted">Натисніть на мапі, щоб поставити точку локації.</p>
      <div ref={containerRef} className="h-64 overflow-hidden rounded-[var(--radius-card)] border border-border" />
    </div>
  );
}
