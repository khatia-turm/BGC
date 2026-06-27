import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { PlatformLeaderboardEntry } from "@entities/leaderboard/model/types";
import styles from "../LeaderboardsPage.module.scss";

type LeaderboardPodiumProps = {
  entries: PlatformLeaderboardEntry[];
};

export const LeaderboardPodium = ({ entries }: LeaderboardPodiumProps) => {
  const { t } = useTranslation();
  const topThree = entries.slice(0, 3);

  return (
    <section className={styles.podium} aria-label={t("leaderboard.topPlayers")}>
      {topThree.map((entry) => (
        <article className={styles.podiumCard} data-rank={entry.rank} key={entry.id}>
          <span className={styles.medal}>#{entry.rank}</span>
          <img src={entry.avatarUrl ?? ""} alt="" />
          <div>
            <Link to={`/players/${entry.userId}`}>{entry.nickname}</Link>
            <p>{entry.ratingPoints.toFixed(1)} {t("leaderboard.pointsShort")}</p>
          </div>
          <dl>
            <div><dt>{t("leaderboard.wins")}</dt><dd>{entry.wins}</dd></div>
            <div><dt>{t("leaderboard.played")}</dt><dd>{entry.tournamentsPlayed}</dd></div>
          </dl>
        </article>
      ))}
    </section>
  );
};
