import { useCallback, useState } from "react";
import { getCityByCoordinates } from "../../api/location";

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
  const [city, setCity] = useState<string | null>(null);
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
        const nextCoordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setCoordinates(nextCoordinates);

        void getCityByCoordinates(
          nextCoordinates.latitude,
          nextCoordinates.longitude,
        )
          .then(({ city: resolvedCity }) => setCity(resolvedCity))
          .catch(() => {
            // Координати все одно придатні для сортування за відстанню.
          })
          .finally(() => setIsLocating(false));
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

  return { coordinates, city, error, isLocating, requestLocation };
}
