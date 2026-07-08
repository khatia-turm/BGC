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
        <p>My tournaments</p>
        <h1>My Events</h1>
        <span>
          Track registrations, waitlists and upcoming tables in one place.
        </span>
      </header>

      {registrations.isPending ? (
        <div className={styles.empty}>{t("common.loading")}</div>
      ) : registrations.isError ? (
        <div className={styles.empty}>{t("common.loadError")}</div>
      ) : events.length ? (
        <section className={styles.eventGrid} aria-label="Registered events">
          {events.map((event) => (
            <MyEventCard event={event} key={event.registrationId} />
          ))}
        </section>
      ) : (
        <div className={styles.empty}>
          You have no tournament registrations yet.
        </div>
      )}
    </main>
  );
};

const MyEventCard = ({ event }: { event: MyTournamentRegistration }) => {
  const { t, i18n } = useTranslation();
  const cancelRegistration = useCancelTournamentRegistration(event.tournamentId);
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
          <dt>Date</dt>
          <dd>{dateFormatter.format(new Date(event.tournamentStartsAt))}</dd>
        </div>
        <div>
          <dt>Location</dt>
          <dd>{event.location ?? "-"}</dd>
        </div>
        <div>
          <dt>Entry fee</dt>
          <dd>
            {event.entryFee != null && event.entryFee > 0
              ? `${event.entryFee.toFixed(2)} GEL`
              : "Free"}
          </dd>
        </div>
        <div>
          <dt>Registered</dt>
          <dd>{dateFormatter.format(new Date(event.registeredAt))}</dd>
        </div>
      </dl>

      <div className={styles.eventActions}>
        <Link to={`/tournaments/${event.tournamentId}`}>View tournament</Link>
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
