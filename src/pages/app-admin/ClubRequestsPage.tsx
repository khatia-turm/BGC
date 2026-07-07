import { useState } from "react";
import { Link } from "react-router-dom";
import { useClubPage, useUpdateClubStatus } from "@entities/club/api";
import { Pagination } from "@shared/ui/Pagination";
import styles from "./AppAdminPages.module.scss";

export const ClubRequestsPage = () => {
  const [page, setPage] = useState(1);
  const requests = useClubPage({
    status: "Pending",
    page,
    pageSize: 10,
    admin: true,
  });
  const updateStatus = useUpdateClubStatus();

  const review = (id: number, status: "Active" | "Rejected") => {
    const reason =
      status === "Rejected"
        ? window.prompt("Reason for rejection?") || "Rejected by app admin"
        : "Approved by app admin";
    updateStatus.mutate({ id, status, reason });
  };

  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <div>
          <p>Club moderation</p>
          <h1>Club requests</h1>
          <span>
            Review new club applications. Approval activates the club; rejection
            leaves the applicant as a regular player account.
          </span>
        </div>
      </header>

      <section className={styles.panel}>
        {requests.isPending ? (
          <div className={styles.message}>Loading club requests...</div>
        ) : requests.isError ? (
          <div className={styles.message}>Could not load club requests.</div>
        ) : requests.data?.items.length ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Club</th>
                  <th>City</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.data.items.map((club) => (
                  <tr key={club.id}>
                    <td>
                      <strong>{club.name}</strong>
                      <small>{club.description}</small>
                    </td>
                    <td>{club.city}</td>
                    <td>
                      <span className={styles.badge}>{club.status}</span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <Link
                          className={styles.ghostButton}
                          to={`/clubs/${club.id}`}
                        >
                          View
                        </Link>
                        <button
                          className={styles.button}
                          disabled={updateStatus.isPending}
                          onClick={() => review(club.id, "Active")}
                        >
                          Approve
                        </button>
                        <button
                          className={styles.dangerButton}
                          disabled={updateStatus.isPending}
                          onClick={() => review(club.id, "Rejected")}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.message}>No pending club requests.</div>
        )}
      </section>
      <Pagination
        page={page}
        totalPages={requests.data?.totalPages ?? 0}
        isPending={requests.isFetching}
        onPageChange={setPage}
      />
    </main>
  );
};
