import { useTranslation } from "react-i18next";
import type { Dispatch, SetStateAction } from "react";
import type { Game } from "@entities/game/model/types";
import styles from "../LeaderboardsPage.module.scss";

type LeaderboardFiltersProps = {
  games: Game[];
  seasons: string[];
  gameId?: number;
  season: string;
  setGameId: Dispatch<SetStateAction<number | undefined>>;
  setSeason: Dispatch<SetStateAction<string>>;
};

export const LeaderboardFilters = ({
  games,
  seasons,
  gameId,
  season,
  setGameId,
  setSeason,
}: LeaderboardFiltersProps) => {
  const { t } = useTranslation();

  return (
    <section className={styles.filters} aria-label={t("leaderboard.filtersLabel")}>
      <label>
        <span>{t("leaderboard.game")}</span>
        <select value={gameId ?? ""} onChange={(event) => setGameId(Number(event.target.value))}>
          {games.map((game) => <option key={game.id} value={game.id}>{game.title}</option>)}
        </select>
      </label>
      <label>
        <span>{t("leaderboard.season")}</span>
        <select value={season} onChange={(event) => setSeason(event.target.value)}>
          {seasons.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>
    </section>
  );
};
