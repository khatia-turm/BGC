import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useNotifications } from "@entities/notification/api";
import styles from "./MePage.module.scss";

export const NotificationsPage = () => {
  const { t } = useTranslation();
  const notifications = useNotifications();

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p>{t("me.notifications.eyebrow")}</p>
        <h1>{t("me.notifications.title")}</h1>
        <span>{t("me.notifications.description")}</span>
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
                    {t("me.events.viewTournament")} -&gt;
                  </Link>
                )}
              </div>
            </article>
          ))}
        </section>
      ) : (
        <div className={styles.empty}>
          {notifications.isPending
            ? t("me.notifications.loading")
            : t("me.notifications.empty")}
        </div>
      )}
    </main>
  );
};
