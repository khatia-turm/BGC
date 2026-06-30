import { useState } from "react";
import { useCurrentUser } from "@entities/user/api";
import { usePlayer } from "@entities/player/api";
import styles from "./MePage.module.scss";

export const MyHistoryPage = () => {
  const current = useCurrentUser();
  const player = usePlayer(current.data?.id ?? Number.NaN);
  const [openedAt] = useState(() => Date.now());
  const history = (player.data?.tournaments ?? []).filter((event) => new Date(event.startsAt).getTime() < openedAt);
  return <main className={styles.page}>
    <header className={styles.header}><p>Competitive record</p><h1>My History</h1><span>Review previous participation, results and tournament status.</span></header>
    {history.length ? <section className={styles.list}>{history.map((event) => <article className={styles.card} key={event.tournamentId}><span className={styles.status}>{event.status}</span><h2>{event.name}</h2><p>{new Date(event.startsAt).toLocaleDateString()} · {event.city}</p></article>)}</section> : <div className={styles.empty}>Completed tournaments will appear here.</div>}
  </main>;
};
