import { useTranslation } from "react-i18next";
import { TournamentCard } from "@entities/tournament/ui/TournamentCard";
import type { Tournament } from "@entities/tournament/model/types";
import type { Game } from "@entities/game/model/types";
import type { Club } from "@entities/club/model/types";
import styles from "../TournamentListPage.module.scss";

type TournamentResultsProps = {
  tournaments: Tournament[];
  games: Game[];
  clubs: Club[];
  isPending: boolean;
  isError: boolean;
};

export const TournamentResults = ({
  tournaments,
  games,
  clubs,
  isPending,
  isError,
}: TournamentResultsProps) => {
  const { t } = useTranslation();

  if (isPending) return <div className={styles.message}>{t("common.loading")}</div>;
  if (isError) return <div className={styles.message}>{t("common.loadError")}</div>;
  if (!tournaments.length) return <div className={styles.message}>{t("tournaments.noResults")}</div>;

  const gamesById = new Map(games.map((game) => [game.id, game]));
  const clubsById = new Map(clubs.map((club) => [club.id, club]));

  return (
    <section className={styles.grid} aria-label={t("tournaments.resultsLabel")}>
      {tournaments.map((tournament) => (
        <TournamentCard
          key={tournament.id}
          tournament={tournament}
          gameTitle={gamesById.get(tournament.gameId)?.title}
          clubName={clubsById.get(tournament.clubId)?.name}
        />
      ))}
    </section>
  );
};
