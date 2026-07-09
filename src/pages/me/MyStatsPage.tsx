import { useTranslation } from "react-i18next";
import styles from "./MePage.module.scss";

export const MyStatsPage = () => {
  const { t } = useTranslation();
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p>{t("me.stats.eyebrow")}</p>
        <h1>{t("me.stats.title")}</h1>
        <span>{t("me.stats.description")}</span>
      </header>
      <div className={styles.empty}>{t("me.stats.empty")}</div>
    </main>
  );
};
