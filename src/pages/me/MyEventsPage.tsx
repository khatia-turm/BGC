import { Link } from "react-router-dom";
import { useCurrentUser } from "@entities/user/api";
import { usePlayer } from "@entities/player/api";
import styles from "./MePage.module.scss";

export const MyEventsPage = () => {
  const current = useCurrentUser();
  const player = usePlayer(current.data?.id ?? Number.NaN);
  const events = player.data?.tournaments ?? [];
  return <main className={styles.page}>
    <header className={styles.header}><p>My tournaments</p><h1>My Events</h1><span>Track registrations, waitlists and upcoming tables in one place.</span></header>
    {events.length ? <section className={styles.grid}>{events.map((event) => <article className={styles.card} key={event.tournamentId}>
      <span className={styles.status}>{event.status}</span><h2>{event.name}</h2><p>{event.city} · {new Date(event.startsAt).toLocaleDateString()}</p><Link to={`/tournaments/${event.tournamentId}`}>View tournament →</Link>
    </article>)}</section> : <div className={styles.empty}>You have no tournament registrations yet.</div>}
  </main>;
};
