import { Link, useParams } from "react-router-dom";
import { useClubRegistrationRequests, useReviewRegistrationRequest } from "@entities/tournament/api";
import styles from "./JoinRequestsPage.module.scss";

export const JoinRequestsPage = () => {
  const clubId=Number(useParams().clubId);
  const requests=useClubRegistrationRequests(clubId);
  const review=useReviewRegistrationRequest(clubId);
  return <main className={styles.page}>
    <header><h1>Join Requests</h1><p>Review players who want to join your tournaments</p></header>
    <section className={styles.list}>{requests.data?.map((request)=><article className={styles.request} key={request.id}>
      <Link className={styles.player} to={`/players/${request.userId}`}>{request.avatarUrl?<img src={request.avatarUrl} alt=""/>:<span>{request.nickname.charAt(0).toUpperCase()}</span>}<div><strong>{request.nickname}</strong><p>{request.rating ? `Rating: ${request.rating} • ` : ""}{request.gameTitle}</p><small>Requested {new Date(request.registeredAt).toLocaleString()}</small></div></Link>
      <div className={styles.tournament}><small>Requested tournament</small><Link to={`../tournaments/${request.tournamentId}`}>{request.tournamentName}</Link></div>
      <div className={styles.actions}><button disabled={review.isPending} onClick={()=>review.mutate({id:request.id,status:"Accepted"})}>Approve</button><button disabled={review.isPending} onClick={()=>review.mutate({id:request.id,status:"Rejected"})}>Reject</button></div>
    </article>)}</section>
    {!requests.isLoading&&!requests.data?.length&&<div className={styles.empty}><strong>No pending requests</strong><span>New tournament registration requests will appear here.</span></div>}
    {review.error&&<p className={styles.error}>{review.error.message}</p>}
  </main>;
};
