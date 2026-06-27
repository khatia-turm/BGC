import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Game } from "../model/types";
import styles from "./GameCard.module.scss";

type GameCardProps = { game: Game };

export const GameCard = ({ game }: GameCardProps) => {
  const { t } = useTranslation();

  return (
    <article className={styles.card}>
      <img src={game.imageUrl} alt="" loading="lazy" />
      <div>
        <h3><Link to={`/games/${game.id}`}>{game.title}</Link></h3>
        <p>{game.minPlayers}–{game.maxPlayers} {t("games.players")} · {game.minPlayingTime}–{game.maxPlayingTime} {t("games.minutes")}</p>
        <span>{game.type}</span>
      </div>
    </article>
  );
};
