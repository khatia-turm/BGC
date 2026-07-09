import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useGamePage,
  useImportHotBoardGames,
  useSeedBoardGamesFromCsv,
} from "@entities/game/api";
import { Pagination } from "@shared/ui/Pagination";
import styles from "./AppAdminPages.module.scss";

export const GamesManagementPage = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const games = useGamePage({
    search: search.trim() || undefined,
    page,
    pageSize: 10,
    sortBy: "rank",
    sortDirection: "asc",
  });
  const importHot = useImportHotBoardGames();
  const seedCsv = useSeedBoardGamesFromCsv();
  const importResult = importHot.data ?? seedCsv.data;

  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <div>
          <p>{t("appAdmin.games.eyebrow")}</p>
          <h1>{t("navigation.games")}</h1>
          <span>{t("appAdmin.games.description")}</span>
        </div>
        <div className={styles.actions}>
          <button
            className={styles.ghostButton}
            disabled={importHot.isPending}
            onClick={() => importHot.mutate()}
          >
            {t("appAdmin.games.importHotBgg")}
          </button>
          <button
            className={styles.button}
            disabled={seedCsv.isPending}
            onClick={() => seedCsv.mutate({ offset: 0, count: 100 })}
          >
            {t("appAdmin.games.seedCsv")}
          </button>
        </div>
      </header>

      {importResult && (
        <section
          className={styles.stats}
          aria-label={t("appAdmin.games.latestImportResult")}
        >
          <Stat
            label={t("appAdmin.games.requested")}
            value={importResult.requestedCount}
          />
          <Stat
            label={t("appAdmin.games.processed")}
            value={importResult.processedCount}
          />
          <Stat
            label={t("appAdmin.games.inserted")}
            value={importResult.insertedCount}
          />
          <Stat
            label={t("appAdmin.common.updated")}
            value={importResult.updatedCount}
          />
        </section>
      )}

      <section className={styles.panel}>
        <div className={styles.filters}>
          <label>
            <span>{t("games.searchLabel")}</span>
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder={t("appAdmin.games.searchPlaceholder")}
            />
          </label>
        </div>

        {games.isPending ? (
          <div className={styles.message}>{t("appAdmin.games.loading")}</div>
        ) : games.isError ? (
          <div className={styles.message}>{t("appAdmin.games.loadError")}</div>
        ) : games.data?.items.length ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t("games.game", { defaultValue: "Game" })}</th>
                  <th>{t("cards.players")}</th>
                  <th>{t("clubs.rank")}</th>
                  <th>{t("games.rating")}</th>
                  <th>{t("games.voters")}</th>
                </tr>
              </thead>
              <tbody>
                {games.data.items.map((game) => (
                  <tr key={game.id}>
                    <td>
                      <strong>{game.title}</strong>
                      <small>
                        {game.year || t("appAdmin.games.unknownYear")}
                      </small>
                    </td>
                    <td>
                      {game.minPlayers}-{game.maxPlayers}
                    </td>
                    <td>#{game.bggOverallRank || "-"}</td>
                    <td>{game.bggAvgRating.toFixed(1)}</td>
                    <td>{game.bggVoters.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.message}>{t("appAdmin.games.noResults")}</div>
        )}
      </section>
      <Pagination
        page={page}
        totalPages={games.data?.totalPages ?? 0}
        isPending={games.isFetching}
        onPageChange={setPage}
      />
    </main>
  );
};

const Stat = ({ label, value }: { label: string; value: number }) => (
  <article className={styles.statCard}>
    <span>{label}</span>
    <strong>{value}</strong>
  </article>
);
