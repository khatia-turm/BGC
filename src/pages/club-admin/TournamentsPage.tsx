import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTournaments } from "@entities/tournament/api";
import type { Tournament } from "@entities/tournament/model/types";
import styles from "./TournamentsPage.module.scss";

const tabs = ["All", "Draft", "Active", "Completed"] as const;
type Tab = (typeof tabs)[number];
const isActive = (status:string) => ["Published","RegistrationOpen","RegistrationClosed","InProgress"].includes(status);
const statusLabel = (status:string) => status.replace(/([A-Z])/g," $1").trim();

export const TournamentsPage = () => {
  const clubId = Number(useParams().clubId);
  const [tab,setTab] = useState<Tab>("All");
  const [managed,setManaged] = useState<Tournament>();
  const [pageOpenedAt] = useState(() => Date.now());
  const tournaments = useTournaments();
  const own = (tournaments.data ?? []).filter((item) => item.clubId === clubId);
  const rows = own.filter((item) => tab === "All" || (tab === "Draft" ? item.status === "Draft" : tab === "Active" ? isActive(item.status) : item.status === "Completed"));
  return <main className={`${styles.page} ${styles.tournamentsPage}`}>
    <header className={styles.tournamentsHeading}><div><h1>Tournaments</h1><p>Create and manage your club tournaments</p></div><Link className={styles.createTournament} to="new">＋ Create Tournament</Link></header>
    <div className={styles.tournamentTabs}>{tabs.map((item) => <button className={tab === item ? styles.selectedTab : ""} key={item} onClick={() => setTab(item)}>{item}</button>)}</div>
    <section className={styles.adminTournamentList}>{rows.map((item) => <article className={styles.adminTournamentCard} key={item.id}>
      <div className={styles.tournamentCardTop}><div><h2>{item.name} <span className={item.status === "Draft" ? styles.draftBadge : styles.publishedBadge}>{item.status === "Draft" ? "Draft" : "Published"}</span></h2>{item.status === "Draft" ? <p>Not yet published</p> : <p>{new Date(item.startsAt).toLocaleString(undefined,{month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit"})} • {item.type} Format</p>}</div>{item.status === "Draft" ? <Link to={`${item.id}/edit`}>Edit</Link> : <button onClick={() => setManaged(item)}>Manage</button>}</div>
      {item.status !== "Draft" && <div className={styles.tournamentMetrics}><div><span>Registrations</span><strong>{item.registeredPlayers}/{item.maxPlayers}</strong></div><div><span>Waitlist</span><strong>{item.waitlistCount ?? 0}</strong></div><div><span>Status</span><strong>{statusLabel(item.status)}</strong></div><div><span>{item.status === "InProgress" ? "Round" : "Days Left"}</span><strong>{item.status === "InProgress" ? "1/5" : Math.max(0,Math.ceil((new Date(item.registrationClosesAt).getTime()-pageOpenedAt)/86400000))}</strong></div></div>}
    </article>)}</section>
    {!rows.length && <div className={styles.empty}><strong>No {tab.toLowerCase()} tournaments</strong><span>Try another filter or create a new tournament.</span></div>}
    {managed && <ManageModal tournament={managed} clubId={clubId} close={() => setManaged(undefined)}/>}
  </main>;
};

const ManageModal = ({tournament,clubId,close}:{tournament:Tournament;clubId:number;close:()=>void}) => <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => {if(event.target === event.currentTarget) close();}}><section className={styles.manageModal} role="dialog" aria-modal="true" aria-labelledby="manage-title"><h2 id="manage-title">Manage Tournament</h2><div className={styles.modalStats}><div><span>Registrations</span><strong>{tournament.registeredPlayers}/{tournament.maxPlayers}</strong></div><div><span>Waitlist</span><strong>{tournament.waitlistCount ?? 0}</strong></div></div><nav><Link to={`/club-admin/${clubId}/tournaments/${tournament.id}/participants?view=check-in`}>Check-in Players</Link><Link to={`/club-admin/${clubId}/tournaments/${tournament.id}/results`}>Enter Match Results</Link><Link to={`/club-admin/${clubId}/tournaments/${tournament.id}/messages`}>Send Notifications</Link><button className={styles.cancelTournament}>Cancel Tournament</button></nav><button className={styles.closeModal} onClick={close}>Close</button></section></div>;
