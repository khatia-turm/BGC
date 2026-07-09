import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useClubPage } from "@entities/club/api";
import { useGamePage } from "@entities/game/api";
import { useUsers } from "@entities/user/api";
import styles from "./AppAdminPages.module.scss";

export const AdminDashboardPage = () => {
  const { t } = useTranslation();
  const pendingClubs = useClubPage({
    status: "Pending",
    page: 1,
    pageSize: 5,
    admin: true,
  });
  const activeClubs = useClubPage({
    status: "Active",
    page: 1,
    pageSize: 1,
    admin: true,
  });
  const suspendedClubs = useClubPage({
    status: "Suspended",
    page: 1,
    pageSize: 1,
    admin: true,
  });
  const activeUsers = useUsers("Active", 1, 1);
  const suspendedUsers = useUsers("Suspended", 1, 1);
  const games = useGamePage({ page: 1, pageSize: 1 });

  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <div>
          <p>{t("appAdmin.dashboard.eyebrow")}</p>
          <h1>{t("appAdmin.dashboard.title")}</h1>
          <span>{t("appAdmin.dashboard.description")}</span>
        </div>
      </header>

      <section
        className={styles.stats}
        aria-label={t("appAdmin.dashboard.overview")}
      >
        <Stat
          label={t("appAdmin.dashboard.pendingClubRequests")}
          value={pendingClubs.data?.totalCount}
        />
        <Stat
          label={t("appAdmin.dashboard.activeClubs")}
          value={activeClubs.data?.totalCount}
        />
        <Stat
          label={t("appAdmin.dashboard.suspendedClubs")}
          value={suspendedClubs.data?.totalCount}
        />
        <Stat
          label={t("appAdmin.dashboard.activeUsers")}
          value={activeUsers.data?.totalCount}
        />
        <Stat
          label={t("appAdmin.dashboard.suspendedUsers")}
          value={suspendedUsers.data?.totalCount}
        />
        <Stat
          label={t("appAdmin.dashboard.boardGames")}
          value={games.data?.totalCount}
        />
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2>{t("appAdmin.dashboard.pendingClubRequests")}</h2>
          <Link className={styles.ghostButton} to="/admin/club-requests">
            {t("appAdmin.common.reviewAll")}
          </Link>
        </div>
        {pendingClubs.isPending ? (
          <div className={styles.message}>
            {t("appAdmin.common.loadingRequests")}
          </div>
        ) : pendingClubs.data?.items.length ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t("clubs.title")}</th>
                  <th>{t("clubs.cityLabel")}</th>
                  <th>{t("appAdmin.common.status")}</th>
                </tr>
              </thead>
              <tbody>
                {pendingClubs.data.items.map((club) => (
                  <tr key={club.id}>
                    <td>
                      <strong>{club.name}</strong>
                      <small>{club.description}</small>
                    </td>
                    <td>{club.city}</td>
                    <td>
                      <span className={styles.badge}>{club.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.message}>
            {t("appAdmin.common.noPendingRequests")}
          </div>
        )}
      </section>
    </main>
  );
};

const Stat = ({ label, value }: { label: string; value?: number }) => (
  <article className={styles.statCard}>
    <span>{label}</span>
    <strong>{value ?? "..."}</strong>
  </article>
);
