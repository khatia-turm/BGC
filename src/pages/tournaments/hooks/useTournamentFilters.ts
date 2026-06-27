import { useMemo, useState } from "react";
import type { Tournament } from "@entities/tournament/model/types";
import type { Game } from "@entities/game/model/types";
import type { Club } from "@entities/club/model/types";

export type TournamentDateFilter = "all" | "upcoming" | "week" | "month";

type UseTournamentFiltersOptions = {
  tournaments: Tournament[];
  games: Game[];
  clubs: Club[];
};

export const useTournamentFilters = ({
  tournaments,
  games,
  clubs,
}: UseTournamentFiltersOptions) => {
  const [search, setSearch] = useState("");
  const [gameId, setGameId] = useState("all");
  const [clubId, setClubId] = useState("all");
  const [dateFilter, setDateFilter] =
    useState<TournamentDateFilter>("upcoming");

  const filteredTournaments = useMemo(() => {
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() + 7);

    const term = search.trim().toLowerCase();
    const gamesById = new Map(games.map((game) => [game.id, game]));
    const clubsById = new Map(clubs.map((club) => [club.id, club]));

    return tournaments
      .filter((tournament) => {
        const startsAt = new Date(tournament.startsAt);
        const game = gamesById.get(tournament.gameId);
        const club = clubsById.get(tournament.clubId);

        return (
          matchesSearch(term, [
            tournament.name,
            game?.title,
            club?.name,
            tournament.city,
          ]) &&
          matchesId(gameId, tournament.gameId) &&
          matchesId(clubId, tournament.clubId) &&
          matchesDate(dateFilter, startsAt, now, weekEnd)
        );
      })
      .sort(
        (first, second) =>
          new Date(first.startsAt).getTime() -
          new Date(second.startsAt).getTime(),
      );
  }, [clubId, clubs, dateFilter, gameId, games, search, tournaments]);

  return {
    filteredTournaments,
    filters: { search, gameId, clubId, dateFilter },
    actions: { setSearch, setGameId, setClubId, setDateFilter },
  };
};

const matchesSearch = (
  term: string,
  values: Array<string | undefined>,
) => !term || values.some((value) => value?.toLowerCase().includes(term));

const matchesId = (selectedId: string, itemId: number) =>
  selectedId === "all" || itemId === Number(selectedId);

const matchesDate = (
  filter: TournamentDateFilter,
  startsAt: Date,
  now: Date,
  weekEnd: Date,
) => {
  if (filter === "all") return true;
  if (filter === "upcoming") return startsAt >= now;
  if (filter === "week") return startsAt >= now && startsAt <= weekEnd;

  return (
    startsAt >= now &&
    startsAt.getMonth() === now.getMonth() &&
    startsAt.getFullYear() === now.getFullYear()
  );
};
