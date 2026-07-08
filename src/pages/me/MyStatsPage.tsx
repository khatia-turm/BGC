import styles from "./MePage.module.scss";

export const MyStatsPage = () => {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p>Player progress</p>
        <h1>My Stats</h1>
        <span>
          Your ratings and ranking points for every competitive board game.
        </span>
      </header>
      <div className={styles.empty}>
        Your first ranking will appear after a scored tournament.
      </div>
    </main>
  );
};
