import { NavLink, Navigate, Outlet, useParams } from "react-router-dom";
import { useCurrentUser } from "@entities/user/api";
import { useMyClub } from "@entities/club/api";
import { Logo } from "@shared/ui/Logo";
import { PlayerNavigation } from "@widgets/public-navigation";
import styles from "./ClubAdminLayout.module.scss";

const links = [
  ["", "Dashboard"],
  ["tournaments", "Tournaments"],
  ["requests", "Requests"],
  ["games", "Games"],
  ["staff", "Members"],
  ["profile/edit", "Settings"],
] as const;

export const ClubAdminLayout = () => {
  const clubId = Number(useParams().clubId);
  const user = useCurrentUser();
  const club = useMyClub(clubId);
  if (user.isLoading || club.isLoading)
    return <div className={styles.loading}>Opening club workspace…</div>;
  if (!user.data?.clubs.some((item) => item.id === clubId))
    return <Navigate to="/me/profile" replace />;
  if (club.data?.status !== "Active")
    return (
      <div className={styles.shell}>
        <header className={styles.header}>
          <NavLink
            className={styles.brand}
            to={`/club-admin/${clubId}`}
            aria-label="Club admin dashboard"
          >
            <Logo className={styles.logo} />
          </NavLink>
          <div className={styles.inactiveHeader}>
            <strong>{club.data?.name ?? "Club workspace"}</strong>
            <span>{club.data?.status ?? "Unavailable"}</span>
          </div>
          <div className={styles.account}>
            <PlayerNavigation />
          </div>
        </header>
        <section className={styles.content}>
          <main className={styles.inactiveState}>
            <p>Club workspace unavailable</p>
            <h1>{club.data?.name ?? "This club"} is not active.</h1>
            <span>
              Current status: {club.data?.status ?? "Unknown"}. Game inventory
              and other club-admin tools are available after the club is active.
            </span>
            <NavLink to="/me/profile">Back to profile</NavLink>
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
          aria-label="Club admin dashboard"
        >
          <Logo className={styles.logo} />
        </NavLink>
        <nav className={styles.nav}>
          {links.map(([path, label]) => (
            <NavLink
              key={label}
              end={!path}
              to={path}
              className={({ isActive }) =>
                isActive ? styles.active : undefined
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className={styles.account}>
          <PlayerNavigation />
        </div>
      </header>
      <div className={styles.mobileClub}>
        <strong>{club.data?.name}</strong>
        <NavLink to={`/clubs/${clubId}`}>Public profile ↗</NavLink>
      </div>
      <section className={styles.content}>
        <Outlet />
      </section>
    </div>
  );
};
