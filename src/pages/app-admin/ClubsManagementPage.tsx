import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  clubStatuses,
  useAllClubStatusesPage,
  useClubPage,
  useUpdateClubStatus,
} from "@entities/club/api";
import type { ClubStatus } from "@entities/club/model/types";
import { Pagination } from "@shared/ui/Pagination";
import styles from "./AppAdminPages.module.scss";

const statuses: Array<"" | ClubStatus> = ["", ...clubStatuses];

export const ClubsManagementPage = () => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<"" | ClubStatus>("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const filteredClubs = useClubPage({
    status: status || undefined,
    page,
    pageSize: 10,
    admin: true,
    enabled: Boolean(status),
  });
  const allClubs = useAllClubStatusesPage(page, 10);
  const clubs = status ? filteredClubs : allClubs;
  const updateStatus = useUpdateClubStatus();
  const rows =
    clubs.data?.items.filter((club) =>
      `${club.name} ${club.city}`
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
    ) ?? [];

  const changeStatus = (id: number, nextStatus: ClubStatus) => {
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
          <p>{t("appAdmin.clubs.eyebrow")}</p>
          <h1>{t("navigation.clubs")}</h1>
          <span>{t("appAdmin.clubs.description")}</span>
        </div>
      </header>

      <section className={styles.panel}>
        <div className={styles.filters}>
          <label>
            <span>{t("clubs.searchLabel")}</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("appAdmin.clubs.searchPlaceholder")}
            />
          </label>
          <label>
            <span>{t("appAdmin.common.status")}</span>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as "" | ClubStatus);
                setPage(1);
              }}
            >
              {statuses.map((item) => (
                <option key={item || "All"} value={item}>
                  {item || t("appAdmin.common.allStatuses")}
                </option>
              ))}
            </select>
          </label>
        </div>

        {clubs.isPending ? (
          <div className={styles.message}>{t("appAdmin.clubs.loading")}</div>
        ) : clubs.isError ? (
          <div className={styles.message}>{t("appAdmin.clubs.loadError")}</div>
        ) : rows.length ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t("clubs.title")}</th>
                  <th>{t("clubs.cityLabel")}</th>
                  <th>{t("appAdmin.common.status")}</th>
                  <th>{t("appAdmin.common.actions")}</th>
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
                          {t("appAdmin.common.view")}
                        </Link>
                        {club.status !== "Active" && (
                          <button
                            className={styles.button}
                            disabled={updateStatus.isPending}
                            onClick={() => changeStatus(club.id, "Active")}
                          >
                            {t("appAdmin.common.activate")}
                          </button>
                        )}
                        {club.status !== "Suspended" && (
                          <button
                            className={styles.ghostButton}
                            disabled={updateStatus.isPending}
                            onClick={() => changeStatus(club.id, "Suspended")}
                          >
                            {t("appAdmin.common.suspend")}
                          </button>
                        )}
                        {club.status !== "Deleted" && (
                          <button
                            className={styles.dangerButton}
                            disabled={updateStatus.isPending}
                            onClick={() => changeStatus(club.id, "Deleted")}
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
          <div className={styles.message}>{t("appAdmin.clubs.noResults")}</div>
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
