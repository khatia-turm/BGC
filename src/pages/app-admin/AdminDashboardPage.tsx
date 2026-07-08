import { Link } from "react-router-dom";
import { useClubPage } from "@entities/club/api";
import { useGamePage } from "@entities/game/api";
import { useUsers } from "@entities/user/api";
import styles from "./AppAdminPages.module.scss";

export const AdminDashboardPage = () => {
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
          <p>System control</p>
          <h1>Admin dashboard</h1>
          <span>
            Review pending club applications, platform users, clubs,
            tournaments, and synced board game data.
          </span>
        </div>
      </header>

      <section className={styles.stats} aria-label="Platform overview">
        <Stat
          label="Pending club requests"
          value={pendingClubs.data?.totalCount}
        />
        <Stat label="Active clubs" value={activeClubs.data?.totalCount} />
        <Stat label="Suspended clubs" value={suspendedClubs.data?.totalCount} />
        <Stat label="Active users" value={activeUsers.data?.totalCount} />
        <Stat label="Suspended users" value={suspendedUsers.data?.totalCount} />
        <Stat label="Board games" value={games.data?.totalCount} />
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2>Pending club requests</h2>
          <Link className={styles.ghostButton} to="/admin/club-requests">
            Review all
          </Link>
        </div>
        {pendingClubs.isPending ? (
          <div className={styles.message}>Loading requests...</div>
        ) : pendingClubs.data?.items.length ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Club</th>
                  <th>City</th>
                  <th>Status</th>
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
          <div className={styles.message}>No pending requests.</div>
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
