import { useCallback, useEffect, useRef, useState } from "react";
import { getAllShifts, type Shift } from "../../api/shifts";

const PAGE_LIMIT = 20;

export function useInfiniteShifts(
  scrollContainerRef: React.RefObject<HTMLElement>,
  categoryIds: string[],
) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadFirstPage() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getAllShifts({
          page: 1,
          limit: PAGE_LIMIT,
          ...(categoryIds.length ? { categoryIds: categoryIds.join(",") } : {}),
        });
        if (cancelled) return;
        setShifts(response.data);
        setPage(1);
        setTotalPages(response.totalPages);
        setHasMore(response.currentPage < response.totalPages);
      } catch {
        if (!cancelled) setError("Не вдалося завантажити завдання. Спробуйте пізніше.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadFirstPage();
    return () => {
      cancelled = true;
    };
  }, [categoryIds]);

  const goToPage = useCallback(async (targetPage: number) => {
    if (targetPage < 1 || targetPage > totalPages || targetPage === page) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await getAllShifts({
        page: targetPage,
        limit: PAGE_LIMIT,
        ...(categoryIds.length ? { categoryIds: categoryIds.join(",") } : {}),
      });
      setShifts(response.data);
      setPage(response.currentPage);
      setTotalPages(response.totalPages);
      setHasMore(response.currentPage < response.totalPages);
      scrollContainerRef.current?.scrollTo({ top: 0 });
    } catch {
      setError("Не вдалося завантажити сторінку.");
    } finally {
      setIsLoading(false);
    }
  }, [categoryIds, page, scrollContainerRef, totalPages]);

  // 1. Спершу оголошуємо loadNextPage як завжди
  const loadNextPage = useCallback(async () => {
    if (isLoading || isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const response = await getAllShifts({
        page: nextPage,
        limit: PAGE_LIMIT,
        ...(categoryIds.length ? { categoryIds: categoryIds.join(",") } : {}),
      });
      setShifts((prev) => [...prev, ...response.data]);
      setPage(nextPage);
      setHasMore(response.currentPage < response.totalPages);
    } catch {
      setError("Не вдалося завантажити наступну сторінку.");
    } finally {
      setIsLoadingMore(false);
    }
  }, [categoryIds, page, isLoading, isLoadingMore, hasMore]);

  // 2. Тепер loadNextPage вже існує — можна покласти її в ref
  const loadNextPageRef = useRef(loadNextPage);
  useEffect(() => {
    loadNextPageRef.current = loadNextPage;
  }, [loadNextPage]);

  // 3. sentinelRef більше НЕ залежить від loadNextPage — тільки від scrollContainerRef,
  // тож обсервер не перестворюється на кожну зміну стейту пагінації
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      observerRef.current?.disconnect();
      if (!node) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) loadNextPageRef.current();
        },
        { root: scrollContainerRef.current, rootMargin: "120px" },
      );
      observerRef.current.observe(node);
    },
    [scrollContainerRef],
  );

  useEffect(() => () => observerRef.current?.disconnect(), []);

  return { shifts, isLoading, isLoadingMore, error, hasMore, sentinelRef, page, totalPages, goToPage };
}
