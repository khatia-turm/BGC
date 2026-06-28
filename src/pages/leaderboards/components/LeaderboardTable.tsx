import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { PlatformLeaderboardEntry } from "@entities/leaderboard/model/types";
import styles from "../LeaderboardsPage.module.scss";

type LeaderboardTableProps = {
  entries: PlatformLeaderboardEntry[];
};

export const LeaderboardTable = ({ entries }: LeaderboardTableProps) => {
  const { t } = useTranslation();

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>{t("leaderboard.rank")}</th>
            <th>{t("leaderboard.player")}</th>
            <th>{t("leaderboard.points")}</th>
            <th>{t("leaderboard.played")}</th>
            <th>{t("leaderboard.wins")}</th>
            <th>{t("leaderboard.bestFinish")}</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td className={styles.rank}>#{entry.rank}</td>
              <td>
                <Link className={styles.player} to={`/players/${entry.userId}`}>
                  <img src={entry.avatarUrl ?? ""} alt="" />
                  <span>{entry.nickname}</span>
                </Link>
              </td>
              <td className={styles.points}>{entry.ratingPoints.toFixed(1)}</td>
              <td>{entry.tournamentsPlayed}</td>
              <td>{entry.wins}</td>
              <td>#{entry.bestFinish}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
