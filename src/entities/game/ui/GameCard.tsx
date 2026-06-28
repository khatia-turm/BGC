import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Game } from "../model/types";
import styles from "./GameCard.module.scss";

export const GameCard = ({ game }: { game: Game }) => {
  const { t } = useTranslation();
  return <article className={styles.card}>
    <Link className={styles.imageLink} to={`/games/${game.id}`}><img src={game.imageUrl} alt={game.title} loading="lazy" /><span>#{game.bggOverallRank}</span></Link>
    <div className={styles.content}>
      <p className={styles.type}>{game.type} · {game.year}</p>
      <h3><Link to={`/games/${game.id}`}>{game.title}</Link></h3>
      <p className={styles.subtitle}>{game.subtitle}</p>
      <dl>
        <div><dt>{t("games.players")}</dt><dd>{game.minPlayers}–{game.maxPlayers}</dd></div>
        <div><dt>{t("games.playTime")}</dt><dd>{game.minPlayingTime}–{game.maxPlayingTime} {t("games.minutes")}</dd></div>
        <div><dt>{t("games.rating")}</dt><dd>★ {game.bggAvgRating.toFixed(1)}</dd></div>
      </dl>
      <Link className={styles.detailsLink} to={`/games/${game.id}`}>{t("games.viewDetails")} <span aria-hidden="true">→</span></Link>
    </div>
  </article>;
};
