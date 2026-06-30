import { NavLink, Navigate, Outlet, useParams } from "react-router-dom";
import { useCurrentUser } from "@entities/user/api";
import { useClub } from "@entities/club/api";
import { Logo } from "@shared/ui/Logo";
import styles from "./ClubAdminLayout.module.scss";

const links = [
  ["", "Dashboard"], ["tournaments", "Tournaments"], ["requests", "Requests"],
  ["staff", "Members"], ["profile/edit", "Settings"],
] as const;

export const ClubAdminLayout = () => {
  const clubId = Number(useParams().clubId);
  const user = useCurrentUser();
  const club = useClub(clubId);
  if (user.isLoading || club.isLoading) return <div className={styles.loading}>Opening club workspace…</div>;
  if (!user.data?.clubs.some((item) => item.id === clubId)) return <Navigate to="/me/profile" replace />;
  return <div className={styles.shell}>
    <header className={styles.header}>
      <NavLink className={styles.brand} to={`/club-admin/${clubId}`}><Logo className={styles.logo}/><small>Club Admin</small></NavLink>
      <nav className={styles.nav}>{links.map(([path,label]) => <NavLink key={label} end={!path} to={path} className={({isActive}) => isActive ? styles.active : undefined}>{label}</NavLink>)}</nav>
      <div className={styles.account}><NavLink className={styles.bell} to="/me/notifications" aria-label="Notifications">♟<i /></NavLink><NavLink className={styles.user} to="/me/profile"><span>{user.data?.avatarUrl ? <img src={user.data.avatarUrl} alt=""/> : user.data?.nickname.charAt(0).toUpperCase()}</span><b>{user.data?.nickname}</b></NavLink></div>
    </header>
    <div className={styles.mobileClub}><strong>{club.data?.name}</strong><NavLink to={`/clubs/${clubId}`}>Public profile ↗</NavLink></div>
    <section className={styles.content}><Outlet /></section>
  </div>;
};
