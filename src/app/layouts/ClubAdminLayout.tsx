import { NavLink, Navigate, Outlet, useParams } from "react-router-dom";
import { useCurrentUser } from "@entities/user/api";
import { useMyClub } from "@entities/club/api";
import { Logo } from "@shared/ui/Logo";
import { LanguageSwitcher } from "@shared/ui/LanguageSwitcher";
import { PlayerNavigation } from "@widgets/public-navigation";
import { useTranslation } from "react-i18next";
import styles from "./ClubAdminLayout.module.scss";

const links = [
  ["", "dashboard"],
  ["tournaments", "tournaments"],
  ["requests", "requests"],
  ["games", "games"],
  ["staff", "members"],
  ["profile/edit", "settings"],
] as const;

export const ClubAdminLayout = () => {
  const { t } = useTranslation();
  const clubId = Number(useParams().clubId);
  const user = useCurrentUser();
  const club = useMyClub(clubId);
  if (user.isLoading || club.isLoading)
    return <div className={styles.loading}>{t("clubAdmin.layout.loading")}</div>;
  if (!user.data?.clubs.some((item) => item.id === clubId))
    return <Navigate to="/me/profile" replace />;
  if (club.data?.status !== "Active")
    return (
      <div className={styles.shell}>
        <header className={styles.header}>
          <NavLink
            className={styles.brand}
            to={`/club-admin/${clubId}`}
            aria-label={t("clubAdmin.layout.dashboardLabel")}
          >
            <Logo className={styles.logo} />
          </NavLink>
          <div className={styles.inactiveHeader}>
            <strong>{club.data?.name ?? t("clubAdmin.layout.workspace")}</strong>
            <span>{club.data?.status ?? t("clubAdmin.layout.unavailable")}</span>
          </div>
          <div className={styles.account}>
            <PlayerNavigation />
            <LanguageSwitcher contained />
          </div>
        </header>
        <section className={styles.content}>
          <main className={styles.inactiveState}>
            <p>{t("clubAdmin.layout.workspaceUnavailable")}</p>
            <h1>{t("clubAdmin.layout.notActive", { name: club.data?.name ?? t("clubAdmin.layout.thisClub") })}</h1>
            <span>
              {t("clubAdmin.layout.currentStatus", { status: club.data?.status ?? t("clubAdmin.layout.unknown") })}
            </span>
            <NavLink to="/me/profile">{t("clubAdmin.layout.backToProfile")}</NavLink>
          </main>
        </section>
      </div>
    );
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <NavLink
          className={styles.brand}
          to={`/club-admin/${clubId}`}
          aria-label={t("clubAdmin.layout.dashboardLabel")}
        >
          <Logo className={styles.logo} />
        </NavLink>
        <nav className={styles.nav}>
          {links.map(([path, key]) => (
            <NavLink
              key={key}
              end={!path}
              to={path}
              className={({ isActive }) =>
                isActive ? styles.active : undefined
              }
            >
              {t(`clubAdmin.layout.${key}`)}
            </NavLink>
          ))}
        </nav>
        <div className={styles.account}>
          <PlayerNavigation />
          <LanguageSwitcher contained />
        </div>
      </header>
      <div className={styles.mobileClub}>
        <strong>{club.data?.name}</strong>
        <NavLink to={`/clubs/${clubId}`}>{t("clubAdmin.layout.publicProfile")}</NavLink>
      </div>
      <section className={styles.content}>
        <Outlet />
      </section>
    </div>
  );
};
