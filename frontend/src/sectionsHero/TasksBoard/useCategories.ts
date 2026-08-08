import { useEffect, useState } from "react";

import { getCategories, type Category } from "../../api/categories";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    void getCategories()
      .then((data) => {
        if (isCurrent) setCategories(data);
      })
      .catch(() => {
        if (isCurrent) setError("Не вдалося завантажити категорії.");
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  return { categories, error, isLoading };
}
