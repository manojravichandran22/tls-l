import { useState, useMemo } from "react";
import { type SortState } from "@/components/ui/DataTable";

export function useSortableData<T>(
  data: T[],
  getters?: Record<string, (row: T) => unknown>
) {
  const [sortState, setSortState] = useState<SortState>({
    key: "",
    direction: null,
  });

  const sortedData = useMemo(() => {
    if (!sortState.key || !sortState.direction) return data;
    return [...data].sort((a, b) => {
      const aVal = getters?.[sortState.key]
        ? getters[sortState.key](a)
        : (a as Record<string, unknown>)[sortState.key];
      const bVal = getters?.[sortState.key]
        ? getters[sortState.key](b)
        : (b as Record<string, unknown>)[sortState.key];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = String(aVal).localeCompare(String(bVal), undefined, {
        numeric: true,
        sensitivity: "base",
      });
      return sortState.direction === "asc" ? cmp : -cmp;
    });
  }, [data, sortState]);

  return { sortedData, sortState, setSortState };
}