import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { PublicPlayer } from "../model/types";
import styles from "./PlayerCard.module.scss";

type PlayerCardProps = {
  player: PublicPlayer;
};

export const PlayerCard = ({ player }: PlayerCardProps) => {
  const { t, i18n } = useTranslation();
  const joinedAt = new Intl.DateTimeFormat(i18n.resolvedLanguage, {
    month: "short",
    year: "numeric",
  }).format(new Date(player.joinedAt));

  return (
    <article className={styles.card}>
      <img src={player.avatarUrl ?? ""} alt="" loading="lazy" />
      <div className={styles.content}>
        <h2>
          <Link to={`/players/${player.id}`}>{player.nickname}</Link>
        </h2>
        <p>{player.firstName} {player.lastName}</p>
        <span>{t("players.joined", { date: joinedAt })}</span>
      </div>
      <Link className={styles.action} to={`/players/${player.id}`}>
        {t("players.viewProfile")} <span aria-hidden="true">→</span>
      </Link>
    </article>
  );
};
