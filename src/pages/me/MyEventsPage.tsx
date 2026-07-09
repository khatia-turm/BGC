import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  useCancelTournamentRegistration,
  useMyTournamentRegistrations,
} from "@entities/tournament/api";
import type { MyTournamentRegistration } from "@entities/tournament/model/types";
import styles from "./MePage.module.scss";

export const MyEventsPage = () => {
  const { t } = useTranslation();
  const registrations = useMyTournamentRegistrations();
  const events = registrations.data?.items ?? [];

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p>{t("me.events.eyebrow")}</p>
        <h1>{t("me.events.title")}</h1>
        <span>{t("me.events.description")}</span>
      </header>

      {registrations.isPending ? (
        <div className={styles.empty}>{t("common.loading")}</div>
      ) : registrations.isError ? (
        <div className={styles.empty}>{t("common.loadError")}</div>
      ) : events.length ? (
        <section
          className={styles.eventGrid}
          aria-label={t("me.events.registeredEvents")}
        >
          {events.map((event) => (
            <MyEventCard event={event} key={event.registrationId} />
          ))}
        </section>
      ) : (
        <div className={styles.empty}>{t("me.events.empty")}</div>
      )}
    </main>
  );
};

const MyEventCard = ({ event }: { event: MyTournamentRegistration }) => {
  const { t, i18n } = useTranslation();
  const cancelRegistration = useCancelTournamentRegistration(
    event.tournamentId,
  );
  const dateFormatter = new Intl.DateTimeFormat(i18n.resolvedLanguage, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <article className={styles.eventCard}>
      <div className={styles.eventTopLine}>
        <span className={styles.status}>
          {t(`registrationStatuses.${event.status}`)}
        </span>
        {event.waitlistPosition && <span>#{event.waitlistPosition}</span>}
      </div>

      <h2>
        <Link to={`/tournaments/${event.tournamentId}`}>
          {event.tournamentName}
        </Link>
      </h2>
      <p>{event.clubName}</p>

      <dl className={styles.eventDetails}>
        <div>
          <dt>{t("cards.date")}</dt>
          <dd>{dateFormatter.format(new Date(event.tournamentStartsAt))}</dd>
        </div>
        <div>
          <dt>{t("cards.location")}</dt>
          <dd>{event.location ?? "-"}</dd>
        </div>
        <div>
          <dt>{t("tournaments.entryFee")}</dt>
          <dd>
            {event.entryFee != null && event.entryFee > 0
              ? `${event.entryFee.toFixed(2)} GEL`
              : t("tournaments.freeEntry")}
          </dd>
        </div>
        <div>
          <dt>{t("me.events.registered")}</dt>
          <dd>{dateFormatter.format(new Date(event.registeredAt))}</dd>
        </div>
      </dl>

      <div className={styles.eventActions}>
        <Link to={`/tournaments/${event.tournamentId}`}>
          {t("me.events.viewTournament")}
        </Link>
        <button
          disabled={cancelRegistration.isPending}
          onClick={() => cancelRegistration.mutate()}
          type="button"
        >
          {cancelRegistration.isPending
            ? t("tournaments.cancelling")
            : t("tournaments.cancelRegistration")}
        </button>
      </div>
      {cancelRegistration.error && (
        <p className={styles.error}>{cancelRegistration.error.message}</p>
      )}
    </article>
  );
};
