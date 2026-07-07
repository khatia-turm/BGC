import { useDeferredValue, useState } from "react";
import { usePlayers } from "@entities/player/api";

export const usePlayerSearch = () => {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const playersQuery = usePlayers(deferredSearch);

  return {
    search,
    setSearch,
    players: playersQuery.data ?? [],
    isPending: playersQuery.isPending,
    isFetching: playersQuery.isFetching,
    isError: playersQuery.isError,
  };
};
