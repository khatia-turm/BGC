import { useDeferredValue, useState } from "react";
import { usePlayers } from "@entities/player/api";

export const usePlayerSearch = () => {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const normalizedSearch = deferredSearch.trim();
  const canSearch = normalizedSearch.length >= 2;
  const hasSearch = search.trim().length > 0;
  const playersQuery = usePlayers(normalizedSearch, canSearch);

  return {
    search,
    setSearch,
    hasSearch,
    canSearch,
    players: canSearch ? (playersQuery.data ?? []) : [],
    isPending: canSearch && playersQuery.isPending,
    isFetching: playersQuery.isFetching,
    isError: canSearch && playersQuery.isError,
  };
};
