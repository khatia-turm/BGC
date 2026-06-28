import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useGameCategories, useGames } from "@entities/game/api";
import { GameCard } from "@entities/game/ui/GameCard";
import styles from "./GameListPage.module.scss";

export const GameListPage = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const games = useGames({ search: search.trim() || undefined, categoryId: categoryId ? Number(categoryId) : undefined });
  const categories = useGameCategories();
  return <main className={styles.page}>
    <header className={styles.header}><p>{t("games.eyebrow")}</p><h1>{t("games.title")}</h1><span>{t("games.description")}</span></header>
    <section className={styles.filters} aria-label={t("games.filtersLabel")}>
      <label><span>{t("games.searchLabel")}</span><input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("games.searchPlaceholder")} /></label>
      <label><span>{t("games.categoryLabel")}</span><select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}><option value="">{t("games.allCategories")}</option>{categories.data?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
    </section>
    <p className={styles.resultCount}>{t("games.results", { count: games.data?.length ?? 0 })}</p>
    {games.isPending ? <div className={styles.message}>{t("common.loading")}</div> : games.isError ? <div className={styles.message}>{t("common.loadError")}</div> : games.data?.length ? <section className={styles.grid} aria-label={t("games.resultsLabel")}>{games.data.map((game) => <GameCard key={game.id} game={game} />)}</section> : <div className={styles.message}>{t("games.noResults")}</div>}
  </main>;
};
