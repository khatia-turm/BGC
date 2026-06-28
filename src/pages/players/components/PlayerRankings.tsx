import { useTranslation } from "react-i18next";
import type { PlayerRanking } from "@entities/player/model/types";
import type { Game } from "@entities/game/model/types";
import styles from "../PublicPlayerProfilePage.module.scss";

type PlayerRankingsProps = {
  rankings: PlayerRanking[];
  games: Game[];
};

export const PlayerRankings = ({ rankings, games }: PlayerRankingsProps) => {
  const { t } = useTranslation();
  const gamesById = new Map(games.map((game) => [game.id, game]));

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeading}>
        <p>{t("playerProfile.competition")}</p>
        <h2>{t("playerProfile.gameRankings")}</h2>
      </div>
      {rankings.length ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>{t("playerProfile.game")}</th><th>{t("playerProfile.season")}</th><th>{t("playerProfile.rank")}</th><th>{t("playerProfile.points")}</th></tr></thead>
            <tbody>
              {rankings.map((ranking) => (
                <tr key={`${ranking.gameId}-${ranking.season}`}>
                  <td>{gamesById.get(ranking.gameId)?.title ?? "—"}</td>
                  <td>{ranking.season}</td>
                  <td className={styles.rank}>#{ranking.rank}</td>
                  <td>{ranking.ratingPoints.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <div className={styles.empty}>{t("playerProfile.noRankings")}</div>}
    </section>
  );
};
