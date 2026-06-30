import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useCurrentUser } from "@entities/user/api";
import { clearAuthSession } from "@shared/auth/session";
import { routes } from "@shared/config/routes";
import styles from "./PlayerNavigation.module.scss";

export const PlayerNavigation = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userQuery = useCurrentUser();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeMenu = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent && event.key === "Escape") setOpen(false);
      if (event instanceof MouseEvent && !menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", closeMenu);
    document.addEventListener("keydown", closeMenu);
    return () => {
      document.removeEventListener("mousedown", closeMenu);
      document.removeEventListener("keydown", closeMenu);
    };
  }, [open]);

  const logout = () => {
    clearAuthSession();
    queryClient.clear();
    setOpen(false);
    navigate(routes.home);
  };

  const user = userQuery.data;
  const nickname = user?.nickname ?? t("navigation.player");
  const initial = nickname.charAt(0).toUpperCase();
  const firstClub = user?.clubs[0];

  return (
    <div className={styles.profile} ref={menuRef}>
      <button className={styles.trigger} type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <span className={styles.avatar}>
          {user?.avatarUrl ? <img src={user.avatarUrl} alt="" /> : initial}
        </span>
        <span className={styles.identity}><strong>{nickname}</strong></span>
        <span className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`} aria-hidden="true" />
      </button>

      {open && (
        <div className={styles.dropdown} role="menu">
          <div className={styles.summary}>
            <strong>{nickname}</strong>
            <span>{user?.email ?? t("common.loading")}</span>
          </div>
          <NavLink to={routes.myProfile} role="menuitem" onClick={() => setOpen(false)}>{t("navigation.myProfile")}</NavLink>
          <NavLink to={routes.myStats} role="menuitem" onClick={() => setOpen(false)}>{t("navigation.myStats")}</NavLink>
          <NavLink to={routes.myHistory} role="menuitem" onClick={() => setOpen(false)}>{t("navigation.myHistory")}</NavLink>
          <NavLink to={routes.notifications} role="menuitem" onClick={() => setOpen(false)}>{t("navigation.notifications")}</NavLink>
          {firstClub && (
            <NavLink className={styles.clubLink} to={`/club-admin/${firstClub.id}`} role="menuitem" onClick={() => setOpen(false)}>
              {t("navigation.clubDashboard")}<small>{firstClub.name}</small>
            </NavLink>
          )}
          <button className={styles.logout} type="button" role="menuitem" onClick={logout}>{t("navigation.logout")}</button>
        </div>
      )}
    </div>
  );
};
