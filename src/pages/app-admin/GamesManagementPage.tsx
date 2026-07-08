import { useState } from "react";
import {
  useGamePage,
  useImportHotBoardGames,
  useSeedBoardGamesFromCsv,
} from "@entities/game/api";
import { Pagination } from "@shared/ui/Pagination";
import styles from "./AppAdminPages.module.scss";

export const GamesManagementPage = () => {
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
          <p>Board game records</p>
          <h1>Games</h1>
          <span>
            Monitor stored board games and trigger documented AppAdmin imports
            for BGG hot games or CSV seeding.
          </span>
        </div>
        <div className={styles.actions}>
          <button
            className={styles.ghostButton}
            disabled={importHot.isPending}
            onClick={() => importHot.mutate()}
          >
            Import hot BGG
          </button>
          <button
            className={styles.button}
            disabled={seedCsv.isPending}
            onClick={() => seedCsv.mutate({ offset: 0, count: 100 })}
          >
            Seed CSV
          </button>
        </div>
      </header>

      {importResult && (
        <section className={styles.stats} aria-label="Latest import result">
          <Stat label="Requested" value={importResult.requestedCount} />
          <Stat label="Processed" value={importResult.processedCount} />
          <Stat label="Inserted" value={importResult.insertedCount} />
          <Stat label="Updated" value={importResult.updatedCount} />
        </section>
      )}

      <section className={styles.panel}>
        <div className={styles.filters}>
          <label>
            <span>Search</span>
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search board games"
            />
          </label>
        </div>

        {games.isPending ? (
          <div className={styles.message}>Loading games...</div>
        ) : games.isError ? (
          <div className={styles.message}>Could not load games.</div>
        ) : games.data?.items.length ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Game</th>
                  <th>Players</th>
                  <th>Rank</th>
                  <th>Rating</th>
                  <th>Voters</th>
                </tr>
              </thead>
              <tbody>
                {games.data.items.map((game) => (
                  <tr key={game.id}>
                    <td>
                      <strong>{game.title}</strong>
                      <small>{game.year || "Unknown year"}</small>
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
          <div className={styles.message}>No games match that search.</div>
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
