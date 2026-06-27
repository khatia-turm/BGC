import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { routes } from "@shared/config/routes";
import { Logo } from "@shared/ui/Logo";
import styles from "./PublicNavigation.module.scss";

const getLinkClassName = ({ isActive }: { isActive: boolean }) =>
  `${styles.link} ${isActive ? styles.active : ""}`;

export const PublicNavigation = () => {
  const { t } = useTranslation();

  return (
    <header className={styles.header}>
      <nav className={styles.navigation} aria-label={t("navigation.mainLabel")}>
        <NavLink
          className={styles.logo}
          to={routes.home}
          aria-label={t("navigation.homeLabel")}
        >
          <Logo className={styles.brand} />
        </NavLink>

        <div className={styles.primaryLinks}>
          <NavLink className={getLinkClassName} to={routes.tournaments}>
            {t("navigation.events")}
          </NavLink>
          <NavLink className={getLinkClassName} to={routes.clubs}>
            {t("navigation.clubs")}
          </NavLink>
          <NavLink className={getLinkClassName} to={routes.leaderboards}>
            {t("navigation.leaderboards")}
          </NavLink>
          <NavLink className={getLinkClassName} to={routes.players}>
            {t("navigation.players")}
          </NavLink>
        </div>

        <div className={styles.authLinks}>
          <NavLink className={styles.loginLink} to={routes.login}>
            {t("navigation.login")}
          </NavLink>
          <span className={styles.separator} aria-hidden="true">
            /
          </span>
          <NavLink className={styles.registerLink} to={routes.register}>
            {t("navigation.register")}
          </NavLink>
        </div>
      </nav>
    </header>
  );
};
