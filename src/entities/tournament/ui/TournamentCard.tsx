import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Tournament } from "../model/types";
import styles from "./TournamentCard.module.scss";

type TournamentCardProps = {
  tournament: Tournament;
};

export const TournamentCard = ({ tournament }: TournamentCardProps) => {
  const { t, i18n } = useTranslation();
  const date = new Intl.DateTimeFormat(i18n.resolvedLanguage, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(tournament.startsAt));

  return (
    <article className={styles.card}>
      <div className={styles.topLine}>
        <span className={styles.status}>{t("cards.registrationOpen")}</span>
        <span className={styles.type}>{tournament.type}</span>
      </div>
      <h3 className={styles.title}>
        <Link to={`/tournaments/${tournament.id}`}>{tournament.name}</Link>
      </h3>
      <p className={styles.description}>{tournament.description}</p>
      <dl className={styles.details}>
        <div>
          <dt>{t("cards.date")}</dt>
          <dd>{date}</dd>
        </div>
        <div>
          <dt>{t("cards.location")}</dt>
          <dd>{tournament.city}</dd>
        </div>
        <div>
          <dt>{t("cards.players")}</dt>
          <dd>{tournament.registeredPlayers}/{tournament.maxPlayers}</dd>
        </div>
      </dl>
      <Link className={styles.cardLink} to={`/tournaments/${tournament.id}`}>
        {t("cards.viewEvent")} <span aria-hidden="true">→</span>
      </Link>
    </article>
  );
};
