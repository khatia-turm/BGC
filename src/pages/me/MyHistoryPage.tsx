import { useTranslation } from "react-i18next";
import styles from "./MePage.module.scss";

export const MyHistoryPage = () => {
  const { t } = useTranslation();
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p>{t("me.history.eyebrow")}</p>
        <h1>{t("me.history.title")}</h1>
        <span>{t("me.history.description")}</span>
      </header>
      <div className={styles.empty}>{t("me.history.empty")}</div>
    </main>
  );
};
