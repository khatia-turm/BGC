import { useMemo, useState } from "react";
import type { Club } from "@entities/club/model/types";

export const useClubFilters = (clubs: Club[]) => {
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("all");

  const cities = useMemo(
    () => [...new Set(clubs.map((club) => club.city))].sort(),
    [clubs],
  );

  const filteredClubs = useMemo(() => {
    const term = search.trim().toLowerCase();

    return clubs.filter(
      (club) =>
        (city === "all" || club.city === city) &&
        (!term ||
          [club.name, club.city, club.address, club.description].some((value) =>
            value?.toLowerCase().includes(term),
          )),
    );
  }, [city, clubs, search]);

  return { cities, filteredClubs, search, city, setSearch, setCity };
};
