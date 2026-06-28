import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useGame, useGameCategories } from "@entities/game/api";
import { useClubs } from "@entities/club/api";
import { useTournaments } from "@entities/tournament/api";
import { ClubCard } from "@entities/club/ui/ClubCard";
import { TournamentCard } from "@entities/tournament/ui/TournamentCard";
import styles from "./GameDetailsPage.module.scss";

export const GameDetailsPage = () => {
  const { t } = useTranslation();
  const gameId = Number(useParams().gameId);
  const game = useGame(gameId);
  const categories = useGameCategories();
  const clubs = useClubs({ status: "Active" });
  const tournaments = useTournaments();

  if (game.isPending) return <main className={styles.page}><div className={styles.message}>{t("common.loading")}</div></main>;
  if (game.isError || !game.data) return <main className={styles.page}><div className={styles.message}><p>{t("games.notFound")}</p><Link to="/games">{t("games.backToGames")}</Link></div></main>;

  const item = game.data;
  const relatedTournaments = tournaments.data?.filter((entry) => entry.gameId === item.id) ?? [];
  const clubIds = new Set(relatedTournaments.map((entry) => entry.clubId));
  const relatedClubs = clubs.data?.filter((club) => clubIds.has(club.id)) ?? [];
  const categoryNames = categories.data?.filter((category) => item.categoryIds.includes(category.id)).map((category) => category.name) ?? [];

  return <main className={styles.page}>
    <Link className={styles.back} to="/games">← {t("games.backToGames")}</Link>
    <section className={styles.hero}>
      <img src={item.imageUrl} alt={item.title} />
      <div className={styles.heroContent}>
        <div className={styles.badges}><span>{item.type}</span><span>{item.year}</span>{categoryNames.map((name) => <span key={name}>{name}</span>)}</div>
        <h1>{item.title}</h1><p className={styles.subtitle}>{item.subtitle}</p><p className={styles.description}>{item.description}</p>
        <dl className={styles.quickFacts}>
          <div><dt>{t("games.players")}</dt><dd>{item.minPlayers}–{item.maxPlayers}</dd></div>
          <div><dt>{t("games.playTime")}</dt><dd>{item.minPlayingTime}–{item.maxPlayingTime} {t("games.minutes")}</dd></div>
          <div><dt>{t("games.complexity")}</dt><dd>{item.complexity.toFixed(2)} / 5</dd></div>
          <div><dt>{t("games.rating")}</dt><dd>★ {item.bggAvgRating.toFixed(2)}</dd></div>
        </dl>
      </div>
    </section>
    <section className={styles.stats} aria-label={t("games.bggStats")}><div><strong>#{item.bggOverallRank}</strong><span>{t("games.overallRank")}</span></div><div><strong>{item.bggGeekRating.toFixed(1)}</strong><span>{t("games.geekRating")}</span></div><div><strong>{item.bggVoters.toLocaleString()}</strong><span>{t("games.voters")}</span></div><div><strong>{item.bggCommunityPlayerCounts.best.join(", ")}</strong><span>{t("games.bestWith")}</span></div></section>
    <section className={styles.related}><div className={styles.sectionHeading}><div><p>{t("games.whereToPlay")}</p><h2>{t("games.clubsWithGame")}</h2></div><span>{relatedClubs.length}</span></div>{clubs.isPending ? <div className={styles.message}>{t("common.loading")}</div> : relatedClubs.length ? <div className={styles.grid}>{relatedClubs.map((club) => <ClubCard key={club.id} club={club} />)}</div> : <div className={styles.empty}>{t("games.noClubs")}</div>}</section>
    <section className={styles.related}><div className={styles.sectionHeading}><div><p>{t("games.compete")}</p><h2>{t("games.relatedTournaments")}</h2></div><span>{relatedTournaments.length}</span></div>{tournaments.isPending ? <div className={styles.message}>{t("common.loading")}</div> : relatedTournaments.length ? <div className={styles.grid}>{relatedTournaments.map((tournament) => <TournamentCard key={tournament.id} tournament={tournament} clubName={clubs.data?.find((club) => club.id === tournament.clubId)?.name} gameTitle={item.title} />)}</div> : <div className={styles.empty}>{t("games.noTournaments")}</div>}</section>
  </main>;
};
