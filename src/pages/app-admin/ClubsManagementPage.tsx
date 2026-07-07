import { useState } from "react";
import { Link } from "react-router-dom";
import { useClubPage, useUpdateClubStatus } from "@entities/club/api";
import type { ClubStatus } from "@entities/club/model/types";
import { Pagination } from "@shared/ui/Pagination";
import styles from "./AppAdminPages.module.scss";

const statuses: Array<"" | ClubStatus> = [
  "",
  "Pending",
  "Active",
  "Rejected",
  "Suspended",
  "Deleted",
];

export const ClubsManagementPage = () => {
  const [status, setStatus] = useState<"" | ClubStatus>("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const clubs = useClubPage({
    status: status || undefined,
    page,
    pageSize: 10,
    admin: true,
  });
  const updateStatus = useUpdateClubStatus();
  const rows =
    clubs.data?.items.filter((club) =>
      `${club.name} ${club.city}`
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
    ) ?? [];

  const changeStatus = (id: number, nextStatus: ClubStatus) => {
    const reason =
      window.prompt(`Reason for ${nextStatus.toLowerCase()} status?`) ||
      `Changed to ${nextStatus} by app admin`;
    updateStatus.mutate({ id, status: nextStatus, reason });
  };

  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <div>
          <p>Platform clubs</p>
          <h1>Clubs</h1>
          <span>
            View registered clubs, filter by moderation status, and suspend,
            reactivate, reject, or delete clubs when needed.
          </span>
        </div>
      </header>

      <section className={styles.panel}>
        <div className={styles.filters}>
          <label>
            <span>Search</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by club or city"
            />
          </label>
          <label>
            <span>Status</span>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as "" | ClubStatus);
                setPage(1);
              }}
            >
              {statuses.map((item) => (
                <option key={item || "All"} value={item}>
                  {item || "All statuses"}
                </option>
              ))}
            </select>
          </label>
        </div>

        {clubs.isPending ? (
          <div className={styles.message}>Loading clubs...</div>
        ) : clubs.isError ? (
          <div className={styles.message}>Could not load clubs.</div>
        ) : rows.length ? (
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
                {rows.map((club) => (
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
                        {club.status !== "Active" && (
                          <button
                            className={styles.button}
                            disabled={updateStatus.isPending}
                            onClick={() => changeStatus(club.id, "Active")}
                          >
                            Activate
                          </button>
                        )}
                        {club.status !== "Suspended" && (
                          <button
                            className={styles.ghostButton}
                            disabled={updateStatus.isPending}
                            onClick={() => changeStatus(club.id, "Suspended")}
                          >
                            Suspend
                          </button>
                        )}
                        {club.status !== "Deleted" && (
                          <button
                            className={styles.dangerButton}
                            disabled={updateStatus.isPending}
                            onClick={() => changeStatus(club.id, "Deleted")}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.message}>No clubs match those filters.</div>
        )}
      </section>
      <Pagination
        page={page}
        totalPages={clubs.data?.totalPages ?? 0}
        isPending={clubs.isFetching}
        onPageChange={setPage}
      />
    </main>
  );
};
