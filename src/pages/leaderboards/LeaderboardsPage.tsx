import { useTranslation } from "react-i18next";
import { LeaderboardFilters } from "./components/LeaderboardFilters";
import { LeaderboardPodium } from "./components/LeaderboardPodium";
import { LeaderboardTable } from "./components/LeaderboardTable";
import { useLeaderboardPage } from "./hooks/useLeaderboardPage";
import styles from "./LeaderboardsPage.module.scss";

export const LeaderboardsPage = () => {
  const { t } = useTranslation();
  const leaderboard = useLeaderboardPage();

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p>{t("leaderboard.eyebrow")}</p>
        <h1>{t("leaderboard.title")}</h1>
        <span>{t("leaderboard.description")}</span>
      </header>

      <LeaderboardFilters
        games={leaderboard.games}
        seasons={leaderboard.seasons}
        gameId={leaderboard.filters.gameId}
        season={leaderboard.filters.season}
        setGameId={leaderboard.actions.setSelectedGameId}
        setSeason={leaderboard.actions.setSeason}
      />

      {leaderboard.isPending ? (
        <div className={styles.message}>{t("common.loading")}</div>
      ) : leaderboard.isError ? (
        <div className={styles.message}>{t("common.loadError")}</div>
      ) : leaderboard.entries.length ? (
        <>
          <LeaderboardPodium entries={leaderboard.entries} />
          <section className={styles.fullRanking} aria-labelledby="full-ranking-title">
            <div className={styles.sectionHeading}>
              <div>
                <p>{t("leaderboard.completeStandings")}</p>
                <h2 id="full-ranking-title">{t("leaderboard.fullRanking")}</h2>
              </div>
              <span>{t("leaderboard.playersRanked", { count: leaderboard.entries.length })}</span>
            </div>
            <LeaderboardTable entries={leaderboard.entries} />
          </section>
        </>
      ) : (
        <div className={styles.message}>{t("leaderboard.noResults")}</div>
      )}
    </main>
  );
};
