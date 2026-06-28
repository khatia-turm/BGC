import { useTranslation } from "react-i18next";
import { useTournaments } from "@entities/tournament/api";
import { useGames } from "@entities/game/api";
import { useClubs } from "@entities/club/api";
import { TournamentFilters } from "./components/TournamentFilters";
import { TournamentResults } from "./components/TournamentResults";
import { useTournamentFilters } from "./hooks/useTournamentFilters";
import styles from "./TournamentListPage.module.scss";

export const TournamentListPage = () => {
  const { t } = useTranslation();
  const tournamentsQuery = useTournaments();
  const { data: games = [] } = useGames();
  const { data: clubs = [] } = useClubs({ status: "Active" });
  const { filteredTournaments, filters, actions } = useTournamentFilters({
    tournaments: tournamentsQuery.data ?? [],
    games,
    clubs,
  });

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
        actions={actions}
      />

      <div className={styles.resultLine}>
        {t("tournaments.results", { count: filteredTournaments.length })}
      </div>

      <TournamentResults
        tournaments={filteredTournaments}
        games={games}
        clubs={clubs}
        isPending={tournamentsQuery.isPending}
        isError={tournamentsQuery.isError}
      />
    </main>
  );
};
