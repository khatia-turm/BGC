import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  useAdminTournaments,
  useCancelTournament,
  usePublishTournament,
} from "@entities/tournament/api";
import type {
  Tournament,
  TournamentStatus,
} from "@entities/tournament/model/types";
import styles from "./TournamentsPage.module.scss";

const tabs = ["All", "Draft", "Published", "Open", "Closed"] as const;
type Tab = (typeof tabs)[number];

const statusNotes: Record<TournamentStatus, string> = {
  0: "Only club admins can see this. Publish when registration should become public.",
  1: "Public event page is visible. Registration opens at the scheduled time.",
  2: "Players can register now. Full events use the waitlist automatically.",
  3: "Registration is closed. Players can no longer claim seats.",
  4: "Tournament has started. The current API does not manage rounds or results.",
  5: "Tournament is finished.",
  6: "Cancelled tournaments are hidden from public pages.",
};

const filterByTab = (item: Tournament, tab: Tab) => {
  if (tab === "All") return true;
  if (tab === "Draft") return item.status === 0;
  if (tab === "Published") return item.status === 1;
  if (tab === "Open") return item.status === 2;
  return [3, 4, 5, 6].includes(item.status);
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const getRegistrationWindow = (item: Tournament) => {
  const opensAt = item.registrationOpensAt
    ? new Date(item.registrationOpensAt)
    : null;
  const closesAt = item.registrationClosesAt
    ? new Date(item.registrationClosesAt)
    : null;

  if (!opensAt && !closesAt) return "-";

  const now = Date.now();
  const opensLabel = formatDate(item.registrationOpensAt);
  const closesLabel = formatDate(item.registrationClosesAt);

  if (opensAt && now < opensAt.getTime()) {
    return `Opens ${opensLabel} - closes ${closesLabel}`;
  }

  if (closesAt && now <= closesAt.getTime()) {
    return `Open until ${closesLabel}`;
  }

  if (closesAt) {
    return `Closed ${closesLabel}`;
  }

  return `Opened ${opensLabel}`;
};

export const TournamentsPage = () => {
  const { t } = useTranslation();
  const clubId = Number(useParams().clubId);
  const [tab, setTab] = useState<Tab>("All");
  const tournaments = useAdminTournaments(clubId);
  const rows = (tournaments.data ?? []).filter((item) => filterByTab(item, tab));

  return (
    <main className={`${styles.page} ${styles.tournamentsPage}`}>
      <header className={styles.tournamentsHeading}>
        <div>
          <h1>{t("clubAdmin.tournaments.title")}</h1>
          <p>{t("clubAdmin.tournaments.description")}</p>
        </div>
        <Link className={styles.createTournament} to="new">
          + {t("clubAdmin.common.createTournament")}
        </Link>
      </header>
      <div className={styles.tournamentTabs}>
        {tabs.map((item) => (
          <button
            className={tab === item ? styles.selectedTab : ""}
            key={item}
            onClick={() => setTab(item)}
            type="button"
          >
            {t(`clubAdmin.tournaments.tabs.${item}`)}
          </button>
        ))}
      </div>
      <section className={styles.lifecycleNote}>
        <strong>{t("clubAdmin.tournaments.lifecycleTitle")}</strong>
        <span>{t("clubAdmin.tournaments.lifecycleDescription")}</span>
      </section>
      <section className={styles.adminTournamentList}>
        {tournaments.isPending
          ? (
              <div className={styles.empty}>
                <span>{t("common.loading")}</span>
              </div>
            )
          : rows.map((item) => <TournamentRow item={item} key={item.id} />)}
      </section>
      {!tournaments.isPending && !rows.length && (
        <div className={styles.empty}>
          <strong>
            {t("clubAdmin.tournaments.noRows", {
              tab: t(`clubAdmin.tournaments.tabs.${tab}`).toLowerCase(),
            })}
          </strong>
          <span>{t("clubAdmin.tournaments.noRowsHint")}</span>
        </div>
      )}
    </main>
  );
};

const TournamentRow = ({ item }: { item: Tournament }) => {
  const { t } = useTranslation();
  const publish = usePublishTournament(item.id);
  const cancel = useCancelTournament(item.id);
  const canPublish = item.status === 0;
  const canCancel = item.status !== 5 && item.status !== 6;
  const canEdit = item.status <= 3;
  const error = publish.error ?? cancel.error;

  return (
    <article className={styles.adminTournamentCard}>
      <div className={styles.tournamentCardTop}>
        <div>
          <h2>
            {item.name}
            <span
              className={
                item.status === 0
                  ? styles.draftBadge
                  : item.status === 6
                    ? styles.cancelledBadge
                    : styles.publishedBadge
              }
            >
              {t(`tournamentStatuses.${item.status}`)}
            </span>
          </h2>
          <p>{statusNotes[item.status]}</p>
        </div>
        <div className={styles.rowActions}>
          {canEdit && (
            <Link to={`${item.id}/edit`}>{t("clubAdmin.common.edit")}</Link>
          )}
          {canPublish && (
            <button
              disabled={publish.isPending}
              onClick={() => publish.mutate()}
              type="button"
            >
              {publish.isPending
                ? t("clubAdmin.tournaments.publishing")
                : t("clubAdmin.tournaments.publish")}
            </button>
          )}
          {item.status !== 0 && (
            <Link to={`${item.id}/registrations`}>
              {t("clubAdmin.tournaments.viewRegistrations")}
            </Link>
          )}
          {canCancel && (
            <button
              className={styles.cancelTournament}
              disabled={cancel.isPending}
              onClick={() => cancel.mutate()}
              type="button"
            >
              {cancel.isPending
                ? t("clubAdmin.tournaments.cancelling")
                : t("clubAdmin.tournaments.cancelTournament")}
            </button>
          )}
        </div>
      </div>
      <div className={styles.tournamentMetrics}>
        <div>
          <span>{t("clubAdmin.tournaments.starts")}</span>
          <strong>{formatDate(item.startsAt)}</strong>
        </div>
        <div>
          <span>{t("clubAdmin.tournaments.registrationWindow")}</span>
          <strong>{getRegistrationWindow(item)}</strong>
        </div>
        <div>
          <span>{t("clubAdmin.tournaments.registrations")}</span>
          <strong>
            {item.currentParticipants}/{item.maxParticipants}
          </strong>
        </div>
        <div>
          <span>{t("clubAdmin.tournaments.games")}</span>
          <strong>{item.boardGames?.length ?? 0}</strong>
        </div>
      </div>
      {error && <p className={styles.error}>{error.message}</p>}
    </article>
  );
};
