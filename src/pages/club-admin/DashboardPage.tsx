import { Link, useParams } from "react-router-dom";
import { useClubDashboard } from "@entities/club/api";
import { useCurrentUser } from "@entities/user/api";
import { useTournaments } from "@entities/tournament/api";
import styles from "./ClubAdminPages.module.scss";

export const DashboardPage = () => {
  const clubId = Number(useParams().clubId);
  const dashboard = useClubDashboard(clubId);
  const user = useCurrentUser();
  const tournaments = useTournaments();
  const own = (tournaments.data ?? []).filter((item) => item.clubId === clubId);
  const active = own.filter((item) => !["Completed","Cancelled","Draft"].includes(item.status));
  const upcoming = own.filter((item) => new Date(item.startsAt) > new Date()).slice(0,4);
  const waitlisted = own.reduce((total,item) => total + (item.waitlistCount ?? 0),0);
  return <main className={`${styles.page} ${styles.dashboard}`}>
    <header className={styles.dashboardHeading}><h1>Dashboard</h1><p>Welcome back, {user.data?.nickname}! Here’s your club overview</p></header>
    <section className={styles.stats}>
      <article className={styles.stat}><span>Active Tournaments</span><strong>{active.length}</strong><small>{active.filter((t)=>t.status==="InProgress").length} in progress, {dashboard.data?.upcomingTournaments ?? 0} upcoming</small></article>
      <article className={styles.stat}><span>Total Members</span><strong>{dashboard.data?.totalPlayers ?? 0}</strong><small>Unique registered players</small></article>
      <article className={styles.stat}><span>Pending Requests</span><strong className={styles.altNumber}>{dashboard.data?.pendingMembers ?? 0}</strong><small>Needs your approval</small></article>
      <article className={styles.stat}><span>Waitlist</span><strong>{waitlisted}</strong><small>Players waiting for a spot</small></article>
    </section>
    <section className={styles.upcoming}><div className={styles.sectionTitle}><h2>Upcoming Tournaments</h2><Link className={styles.button} to="tournaments">View All</Link></div>
      <div className={styles.tournamentList}>{upcoming.map((item)=><article className={styles.tournamentRow} key={item.id}><div><h3>{item.name}</h3><p>{new Date(item.startsAt).toLocaleString(undefined,{month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit"})}</p><span className={styles.format}>{item.type} Format</span><span className={styles.spots}>{item.registeredPlayers}/{item.maxPlayers} Spots</span></div><Link to={`tournaments/${item.id}`}>Manage</Link></article>)}</div>
      {!upcoming.length && <div className={styles.dashboardEmpty}><strong>No upcoming tournaments</strong><span>Create your club’s first tournament and start taking registrations.</span><Link className={styles.button} to="tournaments/new">Create Tournament</Link></div>}
    </section>
  </main>;
};
