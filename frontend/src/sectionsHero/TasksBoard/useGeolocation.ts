import { useCallback, useState } from "react";

export interface UserCoordinates {
  latitude: number;
  longitude: number;
}

const getErrorMessage = (error: GeolocationPositionError) => {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Доступ до геолокації заборонено. Дозвольте його в налаштуваннях браузера.";
    case error.POSITION_UNAVAILABLE:
      return "Не вдалося визначити ваше місцезнаходження.";
    case error.TIMEOUT:
      return "Не вдалося отримати точну локацію. Перевірте, чи увімкнена геолокація в браузері та системі, і спробуйте ще раз.";
    default:
      return "Не вдалося визначити ваше місцезнаходження.";
  }
};

export function useGeolocation() {
  const [coordinates, setCoordinates] = useState<UserCoordinates | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Ваш браузер не підтримує визначення геолокації.");
      return;
    }

    setIsLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setIsLocating(false);
      },
      (positionError) => {
        setError(getErrorMessage(positionError));
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 20_000,
        maximumAge: 60_000,
      },
    );
  }, []);

  return { coordinates, error, isLocating, requestLocation };
}
