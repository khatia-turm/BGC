import { useState, type SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import { useTournamentPage } from "@entities/tournament/api";
import { useGames } from "@entities/game/api";
import { useClubs } from "@entities/club/api";
import { TournamentFilters } from "@features/tournament-list/ui/TournamentFilters";
import { TournamentResults } from "@features/tournament-list/ui/TournamentResults";
import { useTournamentFilters } from "@features/tournament-list/model/useTournamentFilters";
import { Pagination } from "@shared/ui/Pagination";
import styles from "./TournamentListPage.module.scss";

export const TournamentListPage = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const tournamentsQuery = useTournamentPage(page, 20);
  const { data: games = [] } = useGames();
  const { data: clubs = [] } = useClubs({ status: "Active" });
  const { filteredTournaments, filters, actions } = useTournamentFilters({
    tournaments: tournamentsQuery.data?.items ?? [],
    games,
    clubs,
  });
  const paginatedActions = {
    setSearch: (value: SetStateAction<string>) => {
      setPage(1);
      actions.setSearch(value);
    },
    setGameId: (value: SetStateAction<string>) => {
      setPage(1);
      actions.setGameId(value);
    },
    setClubId: (value: SetStateAction<string>) => {
      setPage(1);
      actions.setClubId(value);
    },
    setDateFilter: (value: SetStateAction<typeof filters.dateFilter>) => {
      setPage(1);
      actions.setDateFilter(value);
    },
    setSortOrder: (value: SetStateAction<typeof filters.sortOrder>) => {
      setPage(1);
      actions.setSortOrder(value);
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
        tournaments={filteredTournaments}
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
