import { useMemo, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAddClubBoardGame, useClubGames } from "@entities/club/api";
import { useBggGame, useBggSearch } from "@entities/game/api";
import type { BggSearchResult } from "@entities/game/api";
import styles from "./ClubAdminPages.module.scss";

const formatRange = (
  min: number | null | undefined,
  max: number | null | undefined,
) => {
  if (!min && !max) return null;
  if (!max || min === max) return String(min ?? max);
  return `${min}-${max}`;
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";

type AddGameModalProps = {
  clubId: number;
  close: () => void;
};

const AddGameModal = ({ clubId, close }: AddGameModalProps) => {
  const { t } = useTranslation();
  const [keyword, setKeyword] = useState("");
  const [selectedResult, setSelectedResult] = useState<BggSearchResult | null>(
    null,
  );
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
    addGame.mutate(selectedResult.bggId, {
      onSuccess: () => {
        search.reset();
        setSelectedResult(null);
        setKeyword("");
      },
    });
  };

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
      <section
        className={styles.inventoryModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-game-title"
      >
        <header className={styles.modalHeader}>
          <div>
            <p>{t("clubAdmin.inventory.addFromBgg")}</p>
            <h2 id="add-game-title">{t("clubAdmin.inventory.addNewGame")}</h2>
          </div>
          <button
            className={styles.closeButton}
            type="button"
            onClick={close}
            disabled={addGame.isPending}
          >
            {t("clubAdmin.common.close")}
          </button>
        </header>

        {addGame.isSuccess ? (
          <div className={styles.resultMessage}>
            <strong>
              {t("clubAdmin.inventory.added", { title: addGame.data.title })}
            </strong>
            <span>{t("clubAdmin.inventory.updated")}</span>
            <button className={styles.button} type="button" onClick={close}>
              {t("common.done")}
            </button>
          </div>
        ) : (
          <>
            <form className={styles.modalSearch} onSubmit={submitSearch}>
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder={t("clubAdmin.inventory.searchBgg")}
                autoFocus
              />
              <button
                className={styles.button}
                type="submit"
                disabled={search.isPending || !keyword.trim()}
              >
                {search.isPending
                  ? t("players.searching")
                  : t("clubs.searchLabel")}
              </button>
            </form>

            {search.isError && (
              <p className={styles.error}>{getErrorMessage(search.error)}</p>
            )}

            {results.length > 0 && (
              <div className={styles.searchResults}>
                {results.map((result) => (
                  <button
                    key={result.bggId}
                    className={
                      selectedResult?.bggId === result.bggId
                        ? styles.selectedResult
                        : undefined
                    }
                    type="button"
                    onClick={() => {
                      addGame.reset();
                      setSelectedResult(result);
                    }}
                  >
                    <strong>{result.title}</strong>
                    <span>
                      {result.year ?? t("clubAdmin.inventory.yearUnknown")}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {selectedResult && (
              <article className={styles.gamePreview}>
                {details.isLoading ? (
                  <p>{t("clubAdmin.inventory.loadingDetails")}</p>
                ) : details.isError ? (
                  <p className={styles.error}>
                    {getErrorMessage(details.error)}
                  </p>
                ) : game ? (
                  <>
                    <img src={game.imageUrl} alt="" />
                    <div>
                      <h3>{game.title}</h3>
                      <dl>
                        <div>
                          <dt>{t("cards.players")}</dt>
                          <dd>
                            {formatRange(game.minPlayers, game.maxPlayers) ??
                              t("clubAdmin.inventory.unknown")}
                          </dd>
                        </div>
                        <div>
                          <dt>{t("clubAdmin.inventory.time")}</dt>
                          <dd>
                            {formatRange(
                              game.minPlayingTime,
                              game.maxPlayingTime,
                            ) ?? t("clubAdmin.inventory.unknown")}{" "}
                            {t("games.minutes")}
                          </dd>
                        </div>
                        <div>
                          <dt>{t("games.complexity")}</dt>
                          <dd>
                            {game.complexity?.toFixed(2) ??
                              t("clubAdmin.inventory.unknown")}
                          </dd>
                        </div>
                        <div>
                          <dt>{t("games.rating")}</dt>
                          <dd>
                            {game.bggAvgRating?.toFixed(1) ??
                              t("clubAdmin.inventory.unknown")}
                          </dd>
                        </div>
                      </dl>
                      <p>
                        {game.description ||
                          t("clubAdmin.inventory.noDescription")}
                      </p>
                    </div>
                  </>
                ) : null}
              </article>
            )}

            {addGame.isError && (
              <p className={styles.error}>{getErrorMessage(addGame.error)}</p>
            )}

            <footer className={styles.modalActions}>
              <button
                type="button"
                onClick={close}
                disabled={addGame.isPending}
              >
                {t("common.cancel")}
              </button>
              <button
                className={styles.button}
                type="button"
                onClick={confirmAdd}
                disabled={
                  !selectedResult ||
                  details.isLoading ||
                  details.isError ||
                  addGame.isPending
                }
              >
                {addGame.isPending
                  ? t("clubAdmin.inventory.adding")
                  : t("clubAdmin.inventory.addGame")}
              </button>
            </footer>
          </>
        )}
      </section>
    </div>
  );
};

export const GameInventoryPage = () => {
  const { t } = useTranslation();
  const clubId = Number(useParams().clubId);
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const games = useClubGames(clubId);

  const shown = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return games.data ?? [];
    return (games.data ?? []).filter((item) =>
      item.title.toLowerCase().includes(query),
    );
  }, [games.data, search]);

  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <div>
          <p>{t("clubAdmin.inventory.eyebrow")}</p>
          <h1>{t("clubAdmin.inventory.title")}</h1>
        </div>
        <button
          className={styles.button}
          type="button"
          onClick={() => setIsAddOpen(true)}
        >
          + {t("clubAdmin.inventory.addNewGame")}
        </button>
      </header>

      <div className={styles.inventoryTools}>
        <input
          className={styles.search}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("clubAdmin.inventory.searchCurrent")}
        />
        <span>{t("games.results", { count: shown.length })}</span>
      </div>

      {games.isLoading ? (
        <div className={styles.empty}>{t("clubAdmin.inventory.loading")}</div>
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
                  {formatRange(game.minPlayers, game.maxPlayers) ??
                    t("clubAdmin.inventory.unknown")}{" "}
                  {t("games.players")} /{" "}
                  {formatRange(game.minPlayingTime, game.maxPlayingTime) ??
                    t("clubAdmin.inventory.unknown")}{" "}
                  {t("games.minutes")} /{t("games.complexity")}{" "}
                  {game.complexity.toFixed(2)}
                </p>
                <Link to={`/games/${game.id}`} className={styles.detailsLink}>
                  {t("games.viewDetails")}
                </Link>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <div className={styles.empty}>{t("clubAdmin.inventory.empty")}</div>
      )}

      {isAddOpen && (
        <AddGameModal clubId={clubId} close={() => setIsAddOpen(false)} />
      )}
    </main>
  );
};
