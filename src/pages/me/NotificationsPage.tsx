import { Link } from "react-router-dom";
import { useNotifications } from "@entities/notification/api";
import styles from "./MePage.module.scss";

export const NotificationsPage = () => {
  const notifications = useNotifications();

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p>Inbox</p>
        <h1>Notifications</h1>
        <span>Notifications are not available yet.</span>
      </header>
      {notifications.data?.length ? (
        <section className={styles.list}>
          {notifications.data.map((item) => (
            <article
              className={`${styles.card} ${styles.notification}`}
              key={item.id}
            >
              <i className={styles.dot} />
              <div>
                <span className={styles.status}>{item.type}</span>
                <h3>{item.title}</h3>
                <p>{item.message}</p>
                {item.tournamentId && (
                  <Link to={`/tournaments/${item.tournamentId}`}>
                    View tournament -&gt;
                  </Link>
                )}
              </div>
            </article>
          ))}
        </section>
      ) : (
        <div className={styles.empty}>
          {notifications.isPending
            ? "Loading notifications..."
            : "You have no notifications."}
        </div>
      )}
    </main>
  );
};
