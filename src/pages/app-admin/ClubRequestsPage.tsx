import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useClubPage, useUpdateClubStatus } from "@entities/club/api";
import { Pagination } from "@shared/ui/Pagination";
import styles from "./AppAdminPages.module.scss";

export const ClubRequestsPage = () => {
  const { t } = useTranslation();
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
        ? window.prompt(t("appAdmin.clubRequests.rejectionReason")) ||
          t("appAdmin.clubRequests.rejectedReason")
        : t("appAdmin.clubRequests.approvedReason");
    updateStatus.mutate({ id, status, reason });
  };

  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <div>
          <p>{t("appAdmin.clubRequests.eyebrow")}</p>
          <h1>{t("appAdmin.layout.clubRequests")}</h1>
          <span>{t("appAdmin.clubRequests.description")}</span>
        </div>
      </header>

      <section className={styles.panel}>
        {requests.isPending ? (
          <div className={styles.message}>
            {t("appAdmin.clubRequests.loading")}
          </div>
        ) : requests.isError ? (
          <div className={styles.message}>
            {t("appAdmin.clubRequests.loadError")}
          </div>
        ) : requests.data?.items.length ? (
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
                          {t("appAdmin.common.view")}
                        </Link>
                        <button
                          className={styles.button}
                          disabled={updateStatus.isPending}
                          onClick={() => review(club.id, "Active")}
                        >
                          {t("appAdmin.common.approve")}
                        </button>
                        <button
                          className={styles.dangerButton}
                          disabled={updateStatus.isPending}
                          onClick={() => review(club.id, "Rejected")}
                        >
                          {t("appAdmin.common.reject")}
                        </button>
                      </div>
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
      <Pagination
        page={page}
        totalPages={requests.data?.totalPages ?? 0}
        isPending={requests.isFetching}
        onPageChange={setPage}
      />
    </main>
  );
};
