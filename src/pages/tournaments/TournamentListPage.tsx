import { useMemo, useState, type SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import { useTournamentPage } from "@entities/tournament/api";
import { useGames } from "@entities/game/api";
import { useClubs } from "@entities/club/api";
import { TournamentFilters } from "@features/tournament-list/ui/TournamentFilters";
import { TournamentResults } from "@features/tournament-list/ui/TournamentResults";
import type { TournamentDateFilter } from "@features/tournament-list/model/useTournamentFilters";
import { Pagination } from "@shared/ui/Pagination";
import styles from "./TournamentListPage.module.scss";

export const TournamentListPage = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [gameId, setGameId] = useState("all");
  const [clubId, setClubId] = useState("all");
  const [dateFilter, setDateFilter] =
    useState<TournamentDateFilter>("upcoming");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const tournamentFilters = useMemo(
    () => ({
      search: search.trim() || undefined,
      boardGameId: gameId === "all" ? undefined : Number(gameId),
      clubId: clubId === "all" ? undefined : Number(clubId),
      sortDirection: sortOrder,
      ...getDateRange(dateFilter),
    }),
    [clubId, dateFilter, gameId, search, sortOrder],
  );
  const tournamentsQuery = useTournamentPage(page, 20, tournamentFilters);
  const { data: games = [] } = useGames();
  const { data: clubs = [] } = useClubs({ status: "Active" });
  const filters = { search, gameId, clubId, dateFilter, sortOrder };
  const paginatedActions = {
    setSearch: (value: SetStateAction<string>) => {
      setPage(1);
      setSearch(value);
    },
    setGameId: (value: SetStateAction<string>) => {
      setPage(1);
      setGameId(value);
    },
    setClubId: (value: SetStateAction<string>) => {
      setPage(1);
      setClubId(value);
    },
    setDateFilter: (value: SetStateAction<typeof filters.dateFilter>) => {
      setPage(1);
      setDateFilter(value);
    },
    setSortOrder: (value: SetStateAction<typeof filters.sortOrder>) => {
      setPage(1);
      setSortOrder(value);
    },
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p>{t("tournaments.eyebrow")}</p>
        <h1>{t("tournaments.title")}</h1>
        <span>{t("tournaments.description")}</span>
      </header>

      <TournamentFilters
        games={games}
        clubs={clubs}
        values={filters}
        actions={paginatedActions}
      />

      <div className={styles.resultLine}>
        {t("tournaments.results", {
          count: tournamentsQuery.data?.totalCount ?? 0,
        })}
      </div>

      <TournamentResults
        tournaments={tournamentsQuery.data?.items ?? []}
        games={games}
        clubs={clubs}
        isPending={tournamentsQuery.isPending}
        isError={tournamentsQuery.isError}
      />
      <Pagination
        page={page}
        totalPages={tournamentsQuery.data?.totalPages ?? 0}
        isPending={tournamentsQuery.isFetching}
        onPageChange={setPage}
      />
    </main>
  );
};

const getDateRange = (dateFilter: TournamentDateFilter) => {
  if (dateFilter === "all") return {};

  const now = new Date();
  if (dateFilter === "upcoming") {
    return { startsAfter: now.toISOString() };
  }

  const end = new Date(now);
  if (dateFilter === "week") {
    end.setDate(now.getDate() + 7);
  } else {
    end.setMonth(now.getMonth() + 1);
  }

  return {
    startsAfter: now.toISOString(),
    startsBefore: end.toISOString(),
  };
};
