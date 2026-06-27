import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useClub, useClubGames } from "@entities/club/api";
import { useClubLeaderboard } from "@entities/leaderboard/api";
import styles from "./ClubSubpage.module.scss";

export const ClubLeaderboardsPage = () => {
  const id = Number(useParams().clubId);
  const { t } = useTranslation();
  const clubQuery = useClub(id);
  const gamesQuery = useClubGames(id);
  const [selectedGameId, setSelectedGameId] = useState<number | undefined>();
  const [season, setSeason] = useState(String(new Date().getFullYear()));
  const gameId = selectedGameId ?? gamesQuery.data?.[0]?.id;
  const leaderboardQuery = useClubLeaderboard(id, { gameId, season });

  if (clubQuery.isPending) return <main className={styles.state}>{t("common.loading")}</main>;
  if (!clubQuery.data) return <main className={styles.state}>{t("clubs.notFound")}</main>;

  return (
    <main className={styles.page}>
      <Link className={styles.back} to={`/clubs/${id}`}>← {clubQuery.data.name}</Link>
      <header className={styles.header}><p>{t("clubs.rankingsLabel")}</p><h1>{t("clubs.clubLeaderboards")}</h1><span>{t("clubs.clubLeaderboardsDescription")}</span></header>

      <section className={styles.toolbar} aria-label={t("clubs.leaderboardFilters")}>
        <label><span>{t("tournaments.gameLabel")}</span><select value={gameId ?? ""} onChange={(event) => setSelectedGameId(Number(event.target.value))}>{(gamesQuery.data ?? []).map((game) => <option key={game.id} value={game.id}>{game.title}</option>)}</select></label>
        <label><span>{t("clubs.season")}</span><select value={season} onChange={(event) => setSeason(event.target.value)}><option value="2026">2026</option><option value="2025">2025</option></select></label>
      </section>

      {leaderboardQuery.isPending ? <div className={styles.message}>{t("common.loading")}</div> : leaderboardQuery.data?.length ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>{t("clubs.rank")}</th><th>{t("clubs.player")}</th><th>{t("clubs.ratingPoints")}</th><th>{t("clubs.played")}</th><th>{t("clubs.wins")}</th></tr></thead>
            <tbody>{leaderboardQuery.data.map((entry) => (
              <tr key={entry.id}><td className={styles.rank}>#{entry.rank}</td><td><div className={styles.player}><img src={entry.avatarUrl ?? ""} alt="" /><span>{entry.nickname}</span></div></td><td>{entry.ratingPoints}</td><td>{entry.gamesPlayed}</td><td>{entry.wins}</td></tr>
            ))}</tbody>
          </table>
        </div>
      ) : <div className={styles.message}>{t("clubs.noLeaderboard")}</div>}
    </main>
  );
};
