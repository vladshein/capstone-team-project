import { useMemo } from "react";
import type { ShiftMapMarker } from "../../api/shifts";
import {
  formatShiftDate,
  formatTimeRange,
} from "../../sectionsHero/TasksBoard/formatters";
import Map, { type MapMarkerData } from "./Map";

interface DefMapProps {
  shifts: ShiftMapMarker[];
  userLocation?: { latitude: number; longitude: number } | null;
}

export default function DefMap({ shifts, userLocation }: DefMapProps) {
  const markers = useMemo<MapMarkerData[]>(() => {
    const shiftMarkers = shifts.flatMap((shift) => {
        const latitude = Number(shift.Location?.latitude);
        const longitude = Number(shift.Location?.longitude);

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];

        const title = shift.JobPosition?.title ?? "Зміна";
        const companyName = shift.Location?.Company?.name ?? "Компанія";
        const address = [shift.Location?.address, shift.Location?.city]
          .filter(Boolean)
          .join(", ");
        const durationHours = Math.max(
          0,
          (new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()) /
            (1000 * 60 * 60),
        );
        const totalEarnings =
          durationHours * (Number(shift.hourlyRate) || 0) +
          (Number(shift.bonusRate) || 0);

        return [{
          id: shift.id,
          lat: latitude,
          lng: longitude,
          title,
          description: `${companyName}${address ? ` · ${address}` : ""}`,
          schedule: `${formatShiftDate(shift.startTime)} · ${formatTimeRange(shift.startTime, shift.endTime)}`,
          price: totalEarnings,
          currency: "₴",
        }];
      });
    const markersByLocation = new globalThis.Map<string, MapMarkerData>();

    shiftMarkers.forEach((shiftMarker) => {
      const key = `${shiftMarker.lat.toFixed(6)},${shiftMarker.lng.toFixed(6)}`;
      const marker = markersByLocation.get(key);

      if (marker) {
        marker.shifts = [...(marker.shifts ?? [marker]), shiftMarker];
      } else {
        markersByLocation.set(key, { ...shiftMarker, shifts: [shiftMarker] });
      }
    });

    return [...markersByLocation.values()];
  }, [shifts]);

  const center: [number, number] = userLocation
    ? [userLocation.latitude, userLocation.longitude]
    : markers.length > 0
      ? [markers[0].lat, markers[0].lng]
      : [50.4501, 30.5234];

  return <Map center={center} zoom={11} markers={markers} userLocation={userLocation} />;
}
