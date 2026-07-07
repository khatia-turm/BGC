import { NavLink, Navigate, Outlet, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@entities/user/api";
import { useAuthSession } from "@shared/auth/useAuthSession";
import { clearAuthSession, getAuthRoles } from "@shared/auth/session";
import { Logo } from "@shared/ui/Logo";
import styles from "./AppAdminLayout.module.scss";

const links = [
  ["", "Dashboard"],
  ["club-requests", "Club Requests"],
  ["clubs", "Clubs"],
  ["users", "Users"],
  ["games", "Games"],
] as const;

export const AppAdminLayout = () => {
  const authenticated = useAuthSession();
  const location = useLocation();
  const queryClient = useQueryClient();
  const user = useCurrentUser(authenticated);

  if (!authenticated)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  if (user.isLoading)
    return <div className={styles.loading}>Opening admin workspace...</div>;

  const roles = new Set([...(user.data?.roles ?? []), ...getAuthRoles()]);
  if (!roles.has("AppAdmin")) return <Navigate to="/" replace />;

  const logout = () => {
    clearAuthSession();
    queryClient.clear();
  };

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <NavLink
          className={styles.brand}
          to="/admin"
          aria-label="App admin dashboard"
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
          <div className={styles.adminAccount}>
            <span>
              <strong>{user.data?.nickname ?? "System admin"}</strong>
              <small>{user.data?.email}</small>
            </span>
            <button type="button" onClick={logout}>
              Logout
            </button>
          </div>
        </div>
      </header>
      <div className={styles.mobileContext}>
        <strong>System admin</strong>
        <span>{user.data?.email}</span>
      </div>
      <section className={styles.content}>
        <Outlet />
      </section>
    </div>
  );
};
