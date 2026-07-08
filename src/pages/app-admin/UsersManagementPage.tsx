import { useState } from "react";
import {
  useUpdateUserStatus,
  useUser,
  useUserClubs,
  useUsers,
} from "@entities/user/api";
import type { UserStatus } from "@entities/user/model/types";
import { Pagination } from "@shared/ui/Pagination";
import styles from "./AppAdminPages.module.scss";

const statuses: Array<"" | UserStatus> = [
  "",
  "Active",
  "Suspended",
  "Deleted",
];

export const UsersManagementPage = () => {
  const [status, setStatus] = useState<"" | UserStatus>("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const users = useUsers(status || undefined, page, 10);
  const selectedUser = useUser(selectedUserId ?? 0);
  const selectedUserClubs = useUserClubs(selectedUserId);
  const updateStatus = useUpdateUserStatus();
  const rows =
    users.data?.items.filter((user) =>
      `${user.nickname} ${user.email}`
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
    ) ?? [];

  const changeStatus = (id: number, nextStatus: UserStatus) => {
    const reason =
      window.prompt(`Reason for ${nextStatus.toLowerCase()} status?`) ||
      `Changed to ${nextStatus} by app admin`;
    updateStatus.mutate({ id, status: nextStatus, reason });
  };

  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <div>
          <p>User moderation</p>
          <h1>Users</h1>
          <span>
            Review player accounts and update user status when moderation or
            platform safety requires it.
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
              placeholder="Search nickname or email"
            />
          </label>
          <label>
            <span>Status</span>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as "" | UserStatus);
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

        {users.isPending ? (
          <div className={styles.message}>Loading users...</div>
        ) : users.isError ? (
          <div className={styles.message}>Could not load users.</div>
        ) : rows.length ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Created</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <strong>{user.nickname}</strong>
                    </td>
                    <td>{user.email}</td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span className={styles.badge}>{user.status}</span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={styles.ghostButton}
                          type="button"
                          onClick={() => setSelectedUserId(user.id)}
                        >
                          View
                        </button>
                        {user.status !== "Active" && (
                          <button
                            className={styles.button}
                            disabled={updateStatus.isPending}
                            onClick={() => changeStatus(user.id, "Active")}
                          >
                            Activate
                          </button>
                        )}
                        {user.status !== "Suspended" && (
                          <button
                            className={styles.ghostButton}
                            disabled={updateStatus.isPending}
                            onClick={() => changeStatus(user.id, "Suspended")}
                          >
                            Suspend
                          </button>
                        )}
                        {user.status !== "Deleted" && (
                          <button
                            className={styles.dangerButton}
                            disabled={updateStatus.isPending}
                            onClick={() => changeStatus(user.id, "Deleted")}
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
          <div className={styles.message}>No users match those filters.</div>
        )}
      </section>
      {selectedUserId && (
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>User detail</h2>
            <button
              className={styles.ghostButton}
              type="button"
              onClick={() => setSelectedUserId(null)}
            >
              Close
            </button>
          </div>
          {selectedUser.isPending ? (
            <div className={styles.message}>Loading user detail...</div>
          ) : selectedUser.isError ? (
            <div className={styles.message}>Could not load user detail.</div>
          ) : selectedUser.data ? (
            <div className={styles.detailGrid}>
              <article>
                <span>Nickname</span>
                <strong>{selectedUser.data.nickname}</strong>
              </article>
              <article>
                <span>Name</span>
                <strong>
                  {selectedUser.data.firstName} {selectedUser.data.lastName}
                </strong>
              </article>
              <article>
                <span>Email</span>
                <strong>{selectedUser.data.email}</strong>
              </article>
              {"phone" in selectedUser.data && (
                <article>
                  <span>Phone</span>
                  <strong>{selectedUser.data.phone || "Not provided"}</strong>
                </article>
              )}
              {"status" in selectedUser.data && (
                <article>
                  <span>Status</span>
                  <strong>{selectedUser.data.status}</strong>
                </article>
              )}
              {"updatedAt" in selectedUser.data && (
                <article>
                  <span>Updated</span>
                  <strong>
                    {new Date(selectedUser.data.updatedAt).toLocaleDateString()}
                  </strong>
                </article>
              )}
              <article className={styles.fullWidth}>
                <span>Managed clubs</span>
                <strong>
                  {selectedUserClubs.isPending
                    ? "Loading..."
                    : selectedUserClubs.data?.length
                      ? selectedUserClubs.data
                          .map((club) => `${club.name} (${club.role})`)
                          .join(", ")
                      : "No managed clubs"}
                </strong>
              </article>
            </div>
          ) : null}
        </section>
      )}
      <Pagination
        page={page}
        totalPages={users.data?.totalPages ?? 0}
        isPending={users.isFetching}
        onPageChange={setPage}
      />
    </main>
  );
};
