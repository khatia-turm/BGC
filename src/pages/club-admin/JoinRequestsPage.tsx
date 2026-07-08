import { useTranslation } from "react-i18next";
import styles from "./JoinRequestsPage.module.scss";

export const JoinRequestsPage = () => {
  const { t } = useTranslation();

  return (
    <main className={styles.page}>
      <header>
        <h1>{t("clubAdmin.joinRequests.title")}</h1>
        <p>{t("clubAdmin.joinRequests.description")}</p>
      </header>
      <div className={styles.empty}>
        <strong>{t("clubAdmin.joinRequests.emptyTitle")}</strong>
        <span>{t("clubAdmin.joinRequests.emptyDescription")}</span>
      </div>
    </main>
  );
};
