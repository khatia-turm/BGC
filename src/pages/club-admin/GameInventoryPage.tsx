import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useAddClubBoardGame, useClubGames } from "@entities/club/api";
import { useBggGame, useBggSearch } from "@entities/game/api";
import type { BggSearchResult } from "@entities/game/api";
import styles from "./ClubAdminPages.module.scss";

const formatRange = (min: number | null | undefined, max: number | null | undefined) => {
  if (!min && !max) return "Unknown";
  if (!max || min === max) return String(min ?? max);
  return `${min}-${max}`;
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong. Please try again.";

type AddGameModalProps = {
  clubId: number;
  close: () => void;
};

const AddGameModal = ({ clubId, close }: AddGameModalProps) => {
  const [keyword, setKeyword] = useState("");
  const [selectedResult, setSelectedResult] = useState<BggSearchResult | null>(null);
  const search = useBggSearch();
  const details = useBggGame(selectedResult?.bggId);
  const addGame = useAddClubBoardGame(clubId);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = keyword.trim();
    if (!trimmed) return;
    setSelectedResult(null);
    addGame.reset();
    search.mutate(trimmed);
  };

  const confirmAdd = () => {
    if (!selectedResult) return;
    addGame.mutate(selectedResult.bggId);
  };

  useEffect(() => {
    if (addGame.isSuccess) {
      search.reset();
      setSelectedResult(null);
      setKeyword("");
    }
  }, [addGame.isSuccess, search]);

  const results = search.data ?? [];
  const game = details.data;

  return (
    <div
      className={styles.modalBackdrop}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !addGame.isPending) close();
      }}
    >
      <section className={styles.inventoryModal} role="dialog" aria-modal="true" aria-labelledby="add-game-title">
        <header className={styles.modalHeader}>
          <div>
            <p>Add from BGG</p>
            <h2 id="add-game-title">Add new game</h2>
          </div>
          <button className={styles.closeButton} type="button" onClick={close} disabled={addGame.isPending}>
            Close
          </button>
        </header>

        {addGame.isSuccess ? (
          <div className={styles.resultMessage}>
            <strong>{addGame.data.title} was added successfully.</strong>
            <span>The club inventory has been updated.</span>
            <button className={styles.button} type="button" onClick={close}>
              Done
            </button>
          </div>
        ) : (
          <>
            <form className={styles.modalSearch} onSubmit={submitSearch}>
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Search BoardGameGeek"
                autoFocus
              />
              <button className={styles.button} type="submit" disabled={search.isPending || !keyword.trim()}>
                {search.isPending ? "Searching..." : "Search"}
              </button>
            </form>

            {search.isError && <p className={styles.error}>{getErrorMessage(search.error)}</p>}

            {results.length > 0 && (
              <div className={styles.searchResults}>
                {results.map((result) => (
                  <button
                    key={result.bggId}
                    className={selectedResult?.bggId === result.bggId ? styles.selectedResult : undefined}
                    type="button"
                    onClick={() => {
                      addGame.reset();
                      setSelectedResult(result);
                    }}
                  >
                    <strong>{result.title}</strong>
                    <span>{result.year ?? "Year unknown"}</span>
                  </button>
                ))}
              </div>
            )}

            {selectedResult && (
              <article className={styles.gamePreview}>
                {details.isLoading ? (
                  <p>Loading game details...</p>
                ) : details.isError ? (
                  <p className={styles.error}>{getErrorMessage(details.error)}</p>
                ) : game ? (
                  <>
                    <img src={game.imageUrl} alt="" />
                    <div>
                      <h3>{game.title}</h3>
                      <dl>
                        <div>
                          <dt>Players</dt>
                          <dd>{formatRange(game.minPlayers, game.maxPlayers)}</dd>
                        </div>
                        <div>
                          <dt>Time</dt>
                          <dd>{formatRange(game.minPlayingTime, game.maxPlayingTime)} min</dd>
                        </div>
                        <div>
                          <dt>Complexity</dt>
                          <dd>{game.complexity?.toFixed(2) ?? "Unknown"}</dd>
                        </div>
                        <div>
                          <dt>Rating</dt>
                          <dd>{game.bggAvgRating?.toFixed(1) ?? "Unknown"}</dd>
                        </div>
                      </dl>
                      <p>{game.description || "No description available."}</p>
                    </div>
                  </>
                ) : null}
              </article>
            )}

            {addGame.isError && <p className={styles.error}>{getErrorMessage(addGame.error)}</p>}

            <footer className={styles.modalActions}>
              <button type="button" onClick={close} disabled={addGame.isPending}>
                Cancel
              </button>
              <button
                className={styles.button}
                type="button"
                onClick={confirmAdd}
                disabled={!selectedResult || details.isLoading || details.isError || addGame.isPending}
              >
                {addGame.isPending ? "Adding..." : "Add game"}
              </button>
            </footer>
          </>
        )}
      </section>
    </div>
  );
};

export const GameInventoryPage = () => {
  const clubId = Number(useParams().clubId);
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const games = useClubGames(clubId);

  const shown = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return games.data ?? [];
    return (games.data ?? []).filter((item) => item.title.toLowerCase().includes(query));
  }, [games.data, search]);

  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <div>
          <p>Club catalog</p>
          <h1>Game inventory</h1>
        </div>
        <button className={styles.button} type="button" onClick={() => setIsAddOpen(true)}>
          + Add new game
        </button>
      </header>

      <div className={styles.inventoryTools}>
        <input
          className={styles.search}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search current club games..."
        />
        <span>{shown.length} games</span>
      </div>

      {games.isLoading ? (
        <div className={styles.empty}>Loading game inventory...</div>
      ) : games.isError ? (
        <div className={styles.empty}>{getErrorMessage(games.error)}</div>
      ) : shown.length ? (
        <section className={styles.games}>
          {shown.map((game) => (
            <article className={styles.game} key={game.id}>
              <img src={game.imageUrl} alt="" />
              <div>
                <h3>{game.title}</h3>
                <p>
                  {formatRange(game.minPlayers, game.maxPlayers)} players /{" "}
                  {formatRange(game.minPlayingTime, game.maxPlayingTime)} min / Complexity{" "}
                  {game.complexity.toFixed(2)}
                </p>
                <Link to={`/games/${game.id}`}>View details</Link>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <div className={styles.empty}>Your club inventory is empty. Add games before creating game-specific tournaments.</div>
      )}

      {isAddOpen && <AddGameModal clubId={clubId} close={() => setIsAddOpen(false)} />}
    </main>
  );
};
