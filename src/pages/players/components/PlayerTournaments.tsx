import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { PlayerTournament } from "@entities/player/model/types";
import styles from "../PublicPlayerProfilePage.module.scss";

type PlayerTournamentsProps = {
  tournaments: PlayerTournament[];
};

export const PlayerTournaments = ({ tournaments }: PlayerTournamentsProps) => {
  const { t, i18n } = useTranslation();

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeading}>
        <p>{t("playerProfile.activity")}</p>
        <h2>{t("playerProfile.recentTournaments")}</h2>
      </div>
      {tournaments.length ? (
        <div className={styles.tournamentList}>
          {tournaments.map((tournament) => (
            <Link key={tournament.tournamentId} to={`/tournaments/${tournament.tournamentId}`}>
              <div><strong>{tournament.name}</strong><span>{tournament.city}</span></div>
              <div><span>{new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: "medium" }).format(new Date(tournament.startsAt))}</span><em>{tournament.status}</em></div>
            </Link>
          ))}
        </div>
      ) : <div className={styles.empty}>{t("playerProfile.noTournaments")}</div>}
    </section>
  );
};
