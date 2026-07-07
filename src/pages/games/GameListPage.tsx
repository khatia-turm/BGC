import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  useGameCategories,
  useGamePage,
  type GameFilters,
} from "@entities/game/api";
import { GameCard } from "@entities/game/ui/GameCard";
import { Pagination } from "@shared/ui/Pagination";
import styles from "./GameListPage.module.scss";

export const GameListPage = () => {
  const { t } = useTranslation();
  const routeCategoryId = Number(useParams().categoryId);
  const activeCategoryId = Number.isFinite(routeCategoryId) && routeCategoryId > 0
    ? routeCategoryId
    : undefined;
  const [search, setSearch] = useState("");
  const [players, setPlayers] = useState("");
  const [sortBy, setSortBy] = useState<GameFilters["sortBy"]>("rank");
  const [sortDirection, setSortDirection] =
    useState<GameFilters["sortDirection"]>("asc");
  const [page, setPage] = useState(1);
  const [categoryPage, setCategoryPage] = useState(1);
  const games = useGamePage({
    search: search.trim() || undefined,
    categoryId: activeCategoryId,
    players: players ? Number(players) : undefined,
    sortBy,
    sortDirection,
    page,
    pageSize: 20,
  });
  const categories = useGameCategories();
  const categoryPageSize = 4;
  const featuredCategories = categories.data ?? [];
  const totalCategoryPages = Math.ceil(
    featuredCategories.length / categoryPageSize,
  );
  const visibleCategories = featuredCategories.slice(
    (categoryPage - 1) * categoryPageSize,
    categoryPage * categoryPageSize,
  );
  const activeCategory = categories.data?.find(
    (category) => category.id === activeCategoryId,
  );

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p>{t("games.eyebrow")}</p>
        <h1>{activeCategory?.name ?? t("games.title")}</h1>
        <span>
          {activeCategory
            ? t("games.categoryDescription", { category: activeCategory.name })
            : t("games.description")}
        </span>
      </header>
      <section className={styles.filters} aria-label={t("games.filtersLabel")}>
        <label>
          <span>{t("games.searchLabel")}</span>
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t("games.searchPlaceholder")}
          />
        </label>
        <label>
          <span>{t("games.playersLabel")}</span>
          <input
            type="number"
            min="1"
            value={players}
            onChange={(e) => {
              setPlayers(e.target.value);
              setPage(1);
            }}
            placeholder={t("games.playersPlaceholder")}
          />
        </label>
        <label>
          <span>{t("games.sortLabel")}</span>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as GameFilters["sortBy"]);
              setPage(1);
            }}
          >
            <option value="rank">{t("games.sortByRank")}</option>
            <option value="title">{t("games.sortByTitle")}</option>
          </select>
        </label>
        <label>
          <span>{t("games.directionLabel")}</span>
          <select
            value={sortDirection}
            onChange={(e) => {
              setSortDirection(e.target.value as GameFilters["sortDirection"]);
              setPage(1);
            }}
          >
            <option value="asc">{t("games.sortAsc")}</option>
            <option value="desc">{t("games.sortDesc")}</option>
          </select>
        </label>
      </section>
      {!activeCategoryId && (
        <section
          className={styles.categoryPanel}
          aria-label={t("games.categoriesLabel")}
        >
          <div className={styles.categoryPanelHeader}>
            <h2>{t("games.categoriesLabel")}</h2>
            <div className={styles.categoryControls}>
              <button
                type="button"
                onClick={() => setCategoryPage((current) => current - 1)}
                disabled={categoryPage <= 1}
                aria-label={t("games.previousCategories")}
              >
                {t("games.previousCategories")}
              </button>
              <span>
                {categoryPage} / {Math.max(totalCategoryPages, 1)}
              </span>
              <button
                type="button"
                onClick={() => setCategoryPage((current) => current + 1)}
                disabled={categoryPage >= totalCategoryPages}
                aria-label={t("games.nextCategories")}
              >
                {t("games.nextCategories")}
              </button>
            </div>
          </div>
          <div className={styles.categories}>
            {visibleCategories.map((category) => (
              <Link
                className={styles.categoryBox}
                key={category.id}
                to={`/games/categories/${category.id}`}
              >
                {category.name}
              </Link>
            ))}
          </div>
        </section>
      )}
      {activeCategory && (
        <Link className={styles.backLink} to="/games">
          {t("games.allCategories")}
        </Link>
      )}
      <p className={styles.resultCount}>
        {t("games.results", { count: games.data?.totalCount ?? 0 })}
      </p>
      {games.isPending ? (
        <div className={styles.message}>{t("common.loading")}</div>
      ) : games.isError ? (
        <div className={styles.message}>{t("common.loadError")}</div>
      ) : games.data?.items.length ? (
        <section className={styles.grid} aria-label={t("games.resultsLabel")}>
          {games.data.items.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </section>
      ) : (
        <div className={styles.message}>{t("games.noResults")}</div>
      )}
      <Pagination
        page={page}
        totalPages={games.data?.totalPages ?? 0}
        isPending={games.isFetching}
        onPageChange={setPage}
      />
    </main>
  );
};
