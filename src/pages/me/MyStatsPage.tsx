import { useCurrentUser } from "@entities/user/api";
import { usePlayer } from "@entities/player/api";
import { useGames } from "@entities/game/api";
import styles from "./MePage.module.scss";

export const MyStatsPage = () => {
  const current = useCurrentUser();
  const player = usePlayer(current.data?.id ?? Number.NaN);
  const games = useGames();
  const profile = player.data;
  const gameNames = new Map((games.data ?? []).map((game) => [game.id, game.title]));
  return <main className={styles.page}>
    <header className={styles.header}><p>Player progress</p><h1>My Stats</h1><span>Your ratings and ranking points for every competitive board game.</span></header>
    {profile && <section className={styles.stats}><div className={styles.stat}><strong>{profile.stats.ratingPoints.toFixed(1)}</strong><span>Rating points</span></div><div className={styles.stat}><strong>{profile.stats.tournamentsPlayed}</strong><span>Tournaments</span></div><div className={styles.stat}><strong>{profile.stats.wins}</strong><span>Wins</span></div><div className={styles.stat}><strong>{profile.stats.bestFinish ? `#${profile.stats.bestFinish}` : "—"}</strong><span>Best finish</span></div></section>}
    {profile?.rankings.length ? <section className={styles.grid}>{profile.rankings.map((ranking) => <article className={styles.card} key={`${ranking.gameId}-${ranking.season}`}><p>{gameNames.get(ranking.gameId) ?? "Board game"}</p><h2>#{ranking.rank}</h2><div className={styles.meta}><span>{ranking.season}</span><span>{ranking.ratingPoints.toFixed(1)} points</span></div></article>)}</section> : <div className={styles.empty}>Your first ranking will appear after a scored tournament.</div>}
  </main>;
};
