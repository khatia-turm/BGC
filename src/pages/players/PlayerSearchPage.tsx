import { useTranslation } from "react-i18next";
import { PlayerCard } from "@entities/player/ui/PlayerCard";
import { usePlayerSearch } from "./hooks/usePlayerSearch";
import styles from "./PlayerSearchPage.module.scss";

export const PlayerSearchPage = () => {
  const { t } = useTranslation();
  const playerSearch = usePlayerSearch();

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p>{t("players.eyebrow")}</p>
        <h1>{t("players.title")}</h1>
        <span>{t("players.description")}</span>
      </header>

      <label className={styles.search}>
        <span>{t("players.searchLabel")}</span>
        <input
          type="search"
          value={playerSearch.search}
          onChange={(event) => playerSearch.setSearch(event.target.value)}
          placeholder={t("players.searchPlaceholder")}
        />
      </label>

      <div className={styles.resultLine} aria-live="polite">
        {t("players.results", { count: playerSearch.players.length })}
        {playerSearch.isFetching && !playerSearch.isPending && (
          <span>{t("players.searching")}</span>
        )}
      </div>

      {playerSearch.isPending ? (
        <div className={styles.message}>{t("common.loading")}</div>
      ) : playerSearch.isError ? (
        <div className={styles.message}>{t("common.loadError")}</div>
      ) : playerSearch.players.length ? (
        <section className={styles.grid} aria-label={t("players.resultsLabel")}>
          {playerSearch.players.map((player) => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </section>
      ) : (
        <div className={styles.message}>{t("players.noResults")}</div>
      )}
    </main>
  );
};
