import { Link, useParams } from "react-router-dom";
import { useTournamentParticipants } from "@entities/tournament/api";
import styles from "./ClubAdminPages.module.scss";

const statusLabels = ["Accepted", "Waitlisted", "Cancelled"] as const;

export const RegistrationRequestsPage = () => {
  const clubId = Number(useParams().clubId);
  const id = Number(useParams().id);
  const registrations = useTournamentParticipants(id);

  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <div>
          <p>Tournament registrations</p>
          <h1>Registrations</h1>
        </div>
        <Link className={styles.button} to={`/club-admin/${clubId}/tournaments`}>
          Back to tournaments
        </Link>
      </header>
      <section className={styles.panel}>
        {registrations.isPending ? (
          <div className={styles.empty}>Loading registrations...</div>
        ) : registrations.data?.length ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Player</th>
                <th>Status</th>
                <th>Waitlist</th>
                <th>Registered</th>
              </tr>
            </thead>
            <tbody>
              {registrations.data.map((registration) => (
                <tr key={registration.registrationId}>
                  <td>
                    <strong>{registration.user.displayName}</strong>
                    <small>#{registration.user.id}</small>
                  </td>
                  <td>
                    <span className={styles.badge}>
                      {statusLabels[registration.status]}
                    </span>
                  </td>
                  <td>{registration.waitlistPosition ?? "-"}</td>
                  <td>{new Date(registration.registeredAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className={styles.empty}>No registrations yet.</div>
        )}
      </section>
    </main>
  );
};
