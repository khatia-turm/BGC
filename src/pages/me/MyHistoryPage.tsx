import styles from "./MePage.module.scss";

export const MyHistoryPage = () => {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p>Competitive record</p>
        <h1>My History</h1>
        <span>
          Review previous participation, results and tournament status.
        </span>
      </header>
      <div className={styles.empty}>Completed tournaments will appear here.</div>
    </main>
  );
};
