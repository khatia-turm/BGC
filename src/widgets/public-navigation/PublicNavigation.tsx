import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { routes } from "@shared/config/routes";
import { Logo } from "@shared/ui/Logo";
import { useAuthSession } from "@shared/auth/useAuthSession";
import { PlayerNavigation } from "./PlayerNavigation";
import styles from "./PublicNavigation.module.scss";

export const PublicNavigation = () => {
  const { t } = useTranslation(); const authenticated = useAuthSession(); const [open,setOpen]=useState(false);
  const linkClass = ({isActive}:{isActive:boolean}) => `${styles.link} ${isActive?styles.active:""}`;
  const close=()=>setOpen(false);
  return <header className={styles.header}><nav className={styles.navigation} aria-label={t("navigation.mainLabel")}>
    <NavLink className={styles.logo} to={routes.home} aria-label={t("navigation.homeLabel")}><Logo className={styles.brand}/></NavLink>
    {authenticated && <div className={styles.account}><PlayerNavigation /></div>}
    <button className={styles.menuButton} type="button" aria-expanded={open} aria-label={t("navigation.openMenu")} onClick={()=>setOpen((value)=>!value)}><i/><i/><i/></button>
    {open&&<button className={styles.backdrop} type="button" aria-label={t("navigation.closeMenu")} onClick={close}/>} 
    <div className={`${styles.drawer} ${open?styles.drawerOpen:""}`}>
      <div className={styles.drawerHeading}><Logo className={styles.drawerBrand}/><button type="button" onClick={close} aria-label={t("navigation.closeMenu")}>×</button></div>
      <div className={styles.primaryLinks}>
        <NavLink className={linkClass} to={routes.tournaments} onClick={close}>{t("navigation.events")}</NavLink><NavLink className={linkClass} to={routes.clubs} onClick={close}>{t("navigation.clubs")}</NavLink><NavLink className={linkClass} to={routes.games} onClick={close}>{t("navigation.games")}</NavLink><NavLink className={linkClass} to={routes.leaderboards} onClick={close}>{t("navigation.leaderboards")}</NavLink><NavLink className={linkClass} to={routes.players} onClick={close}>{t("navigation.players")}</NavLink>{authenticated&&<NavLink className={linkClass} to={routes.myEvents} onClick={close}>{t("navigation.myEvents")}</NavLink>}
      </div>
      {!authenticated&&<div className={styles.authLinks}><NavLink className={styles.loginLink} to={routes.login} onClick={close}>{t("navigation.login")}</NavLink><span className={styles.separator}>/</span><NavLink className={styles.registerLink} to={routes.register} onClick={close}>{t("navigation.register")}</NavLink></div>}
    </div>
  </nav></header>;
};
