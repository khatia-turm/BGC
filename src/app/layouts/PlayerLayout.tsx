import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PublicNavigation } from "@widgets/public-navigation";
import { LanguageSwitcher } from "@shared/ui/LanguageSwitcher";
import { routes } from "@shared/config/routes";
import styles from "./PlayerLayout.module.scss";

const links = [
  [routes.myEvents, "myEvents"],
  [routes.myProfile, "myProfile"],
  [routes.myStats, "myStats"],
  [routes.myHistory, "myHistory"],
  [routes.notifications, "notifications"],
] as const;

export const PlayerLayout = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return <>
    <PublicNavigation />
    <nav className={styles.playerNav} aria-label={t("navigation.playerArea")}>
      <button className={styles.playerMenuButton} type="button" aria-expanded={open} onClick={() => setOpen(true)}><span aria-hidden="true">☰</span>{t("navigation.playerArea")}</button>
      {open && <button className={styles.backdrop} type="button" aria-label={t("navigation.closeMenu")} onClick={() => setOpen(false)} />}
      <div className={styles.inner}>
        <div className={styles.sideHeading}><span className={styles.label}>{t("navigation.playerArea")}</span><button type="button" onClick={() => setOpen(false)}>×</button></div>
        <div className={styles.links}>{links.map(([to, key]) => <NavLink key={to} to={to} onClick={() => setOpen(false)} className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ""}`}>{t(`navigation.${key}`)}</NavLink>)}</div>
      </div>
    </nav>
    <Outlet />
    <LanguageSwitcher />
  </>;
};
