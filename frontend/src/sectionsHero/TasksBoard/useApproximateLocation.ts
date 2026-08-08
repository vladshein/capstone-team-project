import { useEffect, useState } from "react";

import {
  getApproximateLocation,
  type ApproximateLocation,
} from "../../api/location";

export function useApproximateLocation() {
  const [location, setLocation] = useState<ApproximateLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;

    void getApproximateLocation()
      .then((data) => {
        if (isCurrent) setLocation(data);
      })
      .catch(() => {
        // IP-локація — лише зручність; помилка не повинна блокувати дошку змін.
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  return { location, isLoading };
}
