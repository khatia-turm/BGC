import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Tournament } from "../model/types";
import { truncateText } from "@shared/lib/truncateText";
import styles from "./TournamentCard.module.scss";

type TournamentCardProps = {
  tournament: Tournament;
  clubName?: string;
  gameTitle?: string;
};

export const TournamentCard = ({
  tournament,
  clubName,
  gameTitle,
}: TournamentCardProps) => {
  const { t, i18n } = useTranslation();
  const isFull = tournament.currentParticipants >= tournament.maxParticipants;
  const primaryGameTitle = gameTitle ?? tournament.boardGames?.[0]?.title;
  const hostName = clubName ?? tournament.clubName;
  const date = new Intl.DateTimeFormat(i18n.resolvedLanguage, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(tournament.startsAt));
  const registrationWindow = getRegistrationWindowLabel(tournament, i18n.resolvedLanguage);

  return (
    <article className={styles.card}>
      <div className={styles.topLine}>
        <span className={styles.status}>
          {isFull ? t("cards.waitlistOpen") : t("cards.registrationOpen")}
        </span>
        <span className={styles.type}>
          {t(`tournamentTypes.${tournament.tournamentType}`)}
        </span>
      </div>
      <h3 className={styles.title}>
        <Link to={`/tournaments/${tournament.id}`}>{tournament.name}</Link>
      </h3>
      {(primaryGameTitle || hostName) && (
        <p className={styles.host}>
          {primaryGameTitle} {primaryGameTitle && hostName ? "-" : ""}{" "}
          {hostName}
        </p>
      )}
      <p className={styles.description}>
        {truncateText(tournament.description ?? "")}
      </p>
      <dl className={styles.details}>
        <div>
          <dt>{t("cards.date")}</dt>
          <dd>{date}</dd>
        </div>
        <div>
          <dt>{t("cards.location")}</dt>
          <dd>{tournament.location ?? "-"}</dd>
        </div>
        <div>
          <dt>{t("cards.players")}</dt>
          <dd>
            {tournament.currentParticipants}/{tournament.maxParticipants}
          </dd>
        </div>
        {registrationWindow && (
          <div>
            <dt>{t("cards.registrationWindow")}</dt>
            <dd>{registrationWindow}</dd>
          </div>
        )}
      </dl>
      <Link className={styles.cardLink} to={`/tournaments/${tournament.id}`}>
        {isFull ? t("cards.joinWaitlist") : t("cards.register")}{" "}
        <span aria-hidden="true">-&gt;</span>
      </Link>
    </article>
  );
};

const getRegistrationWindowLabel = (
  tournament: Tournament,
  locale?: string,
) => {
  if (!tournament.registrationOpensAt && !tournament.registrationClosesAt) {
    return null;
  }

  const formatter = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const now = Date.now();
  const opensAt = tournament.registrationOpensAt
    ? new Date(tournament.registrationOpensAt)
    : null;
  const closesAt = tournament.registrationClosesAt
    ? new Date(tournament.registrationClosesAt)
    : null;

  if (opensAt && now < opensAt.getTime()) {
    return `Opens ${formatter.format(opensAt)}`;
  }

  if (closesAt && now <= closesAt.getTime()) {
    return `Closes ${formatter.format(closesAt)}`;
  }

  if (closesAt) {
    return `Closed ${formatter.format(closesAt)}`;
  }

  return opensAt ? `Opened ${formatter.format(opensAt)}` : null;
};
