import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Club } from "../model/types";
import styles from "./ClubCard.module.scss";

type ClubCardProps = {
  club: Club;
};

export const ClubCard = ({ club }: ClubCardProps) => {
  const { t } = useTranslation();

  return (
    <article className={styles.card}>
      <img className={styles.logo} src={club.logoUrl} alt="" loading="lazy" />
      <div className={styles.content}>
        <div className={styles.heading}>
          <h3>
            <Link to={`/clubs/${club.id}`}>{club.name}</Link>
          </h3>
          <span>{club.status}</span>
        </div>
        <p className={styles.location}>
          {club.city} · {club.address}
        </p>
        <p className={styles.description}>{club.description}</p>
        <Link className={styles.cardLink} to={`/clubs/${club.id}`}>
          {t("cards.viewClub")} <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
};
