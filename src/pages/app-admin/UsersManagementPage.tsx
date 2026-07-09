import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useUpdateUserStatus,
  useUser,
  useUserClubs,
  useUsers,
} from "@entities/user/api";
import type { UserStatus } from "@entities/user/model/types";
import { Pagination } from "@shared/ui/Pagination";
import styles from "./AppAdminPages.module.scss";

const statuses: UserStatus[] = ["Active", "Suspended", "Deleted"];

export const UsersManagementPage = () => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<UserStatus>("Active");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const users = useUsers(status, page, 10);
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
      window.prompt(
        t("appAdmin.common.statusReason", { status: nextStatus.toLowerCase() }),
      ) || t("appAdmin.common.statusChangedReason", { status: nextStatus });
    updateStatus.mutate({ id, status: nextStatus, reason });
  };

  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <div>
          <p>{t("appAdmin.users.eyebrow")}</p>
          <h1>{t("appAdmin.layout.users")}</h1>
          <span>{t("appAdmin.users.description")}</span>
        </div>
      </header>

      <section className={styles.panel}>
        <div className={styles.filters}>
          <label>
            <span>{t("clubs.searchLabel")}</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("appAdmin.users.searchPlaceholder")}
            />
          </label>
          <label>
            <span>{t("appAdmin.common.status")}</span>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as UserStatus);
                setPage(1);
              }}
            >
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>

        {users.isPending ? (
          <div className={styles.message}>{t("appAdmin.users.loading")}</div>
        ) : users.isError ? (
          <div className={styles.message}>{t("appAdmin.users.loadError")}</div>
        ) : rows.length ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t("appAdmin.users.user")}</th>
                  <th>{t("auth.email")}</th>
                  <th>{t("appAdmin.common.created")}</th>
                  <th>{t("appAdmin.common.status")}</th>
                  <th>{t("appAdmin.common.actions")}</th>
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
                          {t("appAdmin.common.view")}
                        </button>
                        {user.status !== "Active" && (
                          <button
                            className={styles.button}
                            disabled={updateStatus.isPending}
                            onClick={() => changeStatus(user.id, "Active")}
                          >
                            {t("appAdmin.common.activate")}
                          </button>
                        )}
                        {user.status !== "Suspended" && (
                          <button
                            className={styles.ghostButton}
                            disabled={updateStatus.isPending}
                            onClick={() => changeStatus(user.id, "Suspended")}
                          >
                            {t("appAdmin.common.suspend")}
                          </button>
                        )}
                        {user.status !== "Deleted" && (
                          <button
                            className={styles.dangerButton}
                            disabled={updateStatus.isPending}
                            onClick={() => changeStatus(user.id, "Deleted")}
                          >
                            {t("appAdmin.common.delete")}
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
          <div className={styles.message}>{t("appAdmin.users.noResults")}</div>
        )}
      </section>
      {selectedUserId && (
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>{t("appAdmin.users.detail")}</h2>
            <button
              className={styles.ghostButton}
              type="button"
              onClick={() => setSelectedUserId(null)}
            >
              {t("clubAdmin.common.close")}
            </button>
          </div>
          {selectedUser.isPending ? (
            <div className={styles.message}>
              {t("appAdmin.users.loadingDetail")}
            </div>
          ) : selectedUser.isError ? (
            <div className={styles.message}>
              {t("appAdmin.users.detailLoadError")}
            </div>
          ) : selectedUser.data ? (
            <div className={styles.detailGrid}>
              <article>
                <span>{t("auth.nickname")}</span>
                <strong>{selectedUser.data.nickname}</strong>
              </article>
              <article>
                <span>{t("appAdmin.users.name")}</span>
                <strong>
                  {selectedUser.data.firstName} {selectedUser.data.lastName}
                </strong>
              </article>
              <article>
                <span>{t("auth.email")}</span>
                <strong>{selectedUser.data.email}</strong>
              </article>
              {"phone" in selectedUser.data && (
                <article>
                  <span>{t("auth.phone")}</span>
                  <strong>
                    {selectedUser.data.phone ||
                      t("appAdmin.common.notProvided")}
                  </strong>
                </article>
              )}
              {"status" in selectedUser.data && (
                <article>
                  <span>{t("appAdmin.common.status")}</span>
                  <strong>{selectedUser.data.status}</strong>
                </article>
              )}
              {"updatedAt" in selectedUser.data && (
                <article>
                  <span>{t("appAdmin.common.updated")}</span>
                  <strong>
                    {new Date(selectedUser.data.updatedAt).toLocaleDateString()}
                  </strong>
                </article>
              )}
              <article className={styles.fullWidth}>
                <span>{t("appAdmin.users.managedClubs")}</span>
                <strong>
                  {selectedUserClubs.isPending
                    ? t("common.loading")
                    : selectedUserClubs.data?.length
                      ? selectedUserClubs.data
                          .map((club) => `${club.name} (${club.role})`)
                          .join(", ")
                      : t("appAdmin.users.noManagedClubs")}
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
