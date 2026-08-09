import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface MapMarkerData {
  id: string | number;
  lat: number;
  lng: number;
  title: string;
  description: string;
  price: number;
  currency?: string;
}

interface MapProps {
  center: [number, number];
  zoom: number;
  markers: MapMarkerData[];
}

export default function Map({ center, zoom, markers }: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Effect 1: Initialize the base map with Canvas Renderer enabled
  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current) {
      // CRITICAL: We enable L.canvas() to offload all marker renderings to GPU sheets
      mapInstanceRef.current = L.map(mapContainerRef.current, {
        renderer: L.canvas()
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

  // Effect 2: Ultra-fast Canvas rendering loop for thousands of markers
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;

    layerGroupRef.current.clearLayers();

    markers.forEach((item) => {
      const currencySymbol = item.currency || '$';
      
      const popupHtml = `
        <div class="p-1 max-w-[220px] font-sans">
          <h3 class="font-bold text-base text-slate-900 m-0 leading-tight">${item.title}</h3>
          <p class="text-xs text-slate-600 my-1.5 leading-snug">${item.description}</p>
          <div class="flex items-center justify-between border-t border-slate-100 pt-1.5 mt-1.5">
            <span class="text-xs text-slate-400 font-medium">Price</span>
            <span class="text-sm font-bold text-emerald-600">${currencySymbol}${item.price.toLocaleString()}</span>
          </div>
        </div>
      `;

      // Use circleMarker for extreme high performance on canvas pipelines
      L.circleMarker([item.lat, item.lng], {
        radius: 8,              // Size of the marker circle point
        fillColor: '#10b981',   // Emerald green fill (matches your tailwind setups)
        color: '#ffffff',       // Pure white outer border line
        weight: 2,              // Thickness of border
        opacity: 1,             // Border transparency 
        fillOpacity: 0.85       // Marker inside transparency
      })
      .bindPopup(popupHtml, { maxWidth: 250 })
      .addTo(layerGroupRef.current!);
    });
  }, [markers]);

  return (
    <div 
      ref={mapContainerRef} 
      className="h-[600px] w-full rounded-xl border border-slate-200 shadow-sm" 
    />
  );
}
