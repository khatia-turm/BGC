import styles from "./MePage.module.scss";

export const MyEventsPage = () => {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p>My tournaments</p>
        <h1>My Events</h1>
        <span>
          Track registrations, waitlists and upcoming tables in one place.
        </span>
      </header>
      <div className={styles.empty}>You have no tournament registrations yet.</div>
    </main>
  );
};
