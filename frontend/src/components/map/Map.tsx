import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface CityLocation {
  name: string;
  lat: number;
  lng: number;
  bbox?: [[number, number], [number, number]];
}

export interface MapMarkerData {
  id: string | number;
  lat: number;
  lng: number;
  title: string;
  description: string;
  schedule: string;
  price: number;
  currency?: string;
  shifts?: MapMarkerData[];
}

interface MapProps {
  center: [number, number];
  zoom: number;
  markers: MapMarkerData[];
  userLocation?: { latitude: number; longitude: number } | null;
  selectedCity?: CityLocation | null; 
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character);

export default function Map({ center, zoom, markers, userLocation, selectedCity }: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const hasFittedBoundsRef = useRef(false);

  // Effect 1: Initialize the base map with Canvas Renderer enabled
  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapContainerRef.current, {
        renderer: L.canvas(),
        scrollWheelZoom: false,
      }).setView(center, zoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
      }).addTo(mapInstanceRef.current);

      layerGroupRef.current = L.layerGroup().addTo(mapInstanceRef.current);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    mapInstanceRef.current?.setView(center, zoom);
  }, [center, zoom]);

  // fly on
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedCity) return;

    if (selectedCity.bbox) {
      mapInstanceRef.current.fitBounds(selectedCity.bbox, {
        padding: [36, 36],
        maxZoom: 13,
        animate: true,
        duration: 1.5,
      });
    } else {
      mapInstanceRef.current.flyTo([selectedCity.lat, selectedCity.lng], 12, {
        duration: 1.5,
      });
    }
  }, [selectedCity]);

  // Ultra-fast Canvas rendering loop for thousands of markers
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;

    layerGroupRef.current.clearLayers();

    const points: L.LatLngExpression[] = [];

    if (userLocation) {
      const userPoint: L.LatLngExpression = [
        userLocation.latitude,
        userLocation.longitude,
      ];
      points.push(userPoint);
      L.circleMarker(userPoint, {
        radius: 10,
        fillColor: '#1a1c23',
        color: '#ffffff',
        weight: 3,
        opacity: 1,
        fillOpacity: 1,
      })
        .bindPopup('Ваша локація')
        .addTo(layerGroupRef.current);
    }

    markers.forEach((item) => {
      const currencySymbol = item.currency || '₴';
      const safeCurrencySymbol = escapeHtml(currencySymbol);
      const point: L.LatLngExpression = [item.lat, item.lng];
      points.push(point);
      const shiftsAtLocation = item.shifts ?? [item];

      {/* fixme: wtf? */}
      const popupHtml = shiftsAtLocation.length > 1
        ? `
          <div style="width: 230px; max-height: 260px; overflow-y: auto; padding: 2px; font-family: Inter, Arial, sans-serif;">
            <h3 style="margin: 0; color: #12131a; font-size: 13px; line-height: 17px; font-weight: 700;">Зміни на локації (${shiftsAtLocation.length})</h3>
            <p style="margin: 3px 0 5px; color: #64748b; font-size: 11px; line-height: 14px;">${escapeHtml(item.description)}</p>
            ${shiftsAtLocation.map((shift) => `
              <div style="border-top: 1px solid #e5e7eb; padding: 7px 0;">
                <strong style="display: block; overflow: hidden; color: #12131a; font-size: 12px; line-height: 15px; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(shift.title)}</strong>
                <span style="display: block; margin-top: 3px; color: #64748b; font-size: 10px; line-height: 13px;">${escapeHtml(shift.schedule)}</span>
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 5px;">
                  <span style="color: #0d9b75; font-size: 12px; font-weight: 700;">${shift.price.toLocaleString("uk-UA")} ${escapeHtml(shift.currency || "₴")}</span>
                  <a href="/shifts/${encodeURIComponent(String(shift.id))}" style="display: inline-flex; min-height: 28px; flex: none; align-items: center; justify-content: center; border-radius: var(--radius-pill); background: var(--color-accent); padding: 0 9px; color: #fff; font-size: 11px; font-weight: 600; text-decoration: none;">Детальніше</a>
                </div>
              </div>`).join("")}
          </div>`
        : `
        <div style="width: 210px; padding: 2px; font-family: Inter, Arial, sans-serif;">
          <h3 style="margin: 0; color: #12131a; font-size: 13px; line-height: 17px; font-weight: 700;">${escapeHtml(item.title)}</h3>
          <p style="margin: 4px 0 7px; color: #64748b; font-size: 11px; line-height: 14px;">${escapeHtml(item.description)}</p>
          <p style="margin: -3px 0 7px; color: #64748b; font-size: 11px; line-height: 14px;">${escapeHtml(item.schedule)}</p>
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; border-top: 1px solid #e5e7eb; padding-top: 7px;">
            <span style="color: #0d9b75; font-size: 13px; font-weight: 700; white-space: nowrap;">${item.price.toLocaleString("uk-UA")} ${safeCurrencySymbol}</span>
            <a href="/shifts/${encodeURIComponent(String(item.id))}" style="display: inline-flex; min-height: 28px; align-items: center; justify-content: center; border-radius: var(--radius-pill); background: var(--color-accent); padding: 0 10px; color: #fff; font-size: 11px; font-weight: 600; text-decoration: none; white-space: nowrap;">Детальніше</a>
          </div>
        </div>
      `;

      L.circleMarker(point, {
        radius: shiftsAtLocation.length > 1 ? 10 : 8,
        fillColor: '#10b981',
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.85
      })
      .bindPopup(popupHtml, { maxWidth: 250 })
      .addTo(layerGroupRef.current!);
    });

    if (!hasFittedBoundsRef.current && points.length > 1) {
      mapInstanceRef.current.fitBounds(L.latLngBounds(points), {
        padding: [36, 36],
        maxZoom: 13,
      });
      hasFittedBoundsRef.current = true;
    }
  }, [markers, userLocation]);

  return (
    <div 
      ref={mapContainerRef} 
      className="relative z-0 h-[600px] w-full max-w-full overflow-hidden rounded-[var(--radius-card)] border border-border shadow-sm"
    />
  );
}