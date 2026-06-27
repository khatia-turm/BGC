import { Link, NavLink, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useClub, useClubGames } from "@entities/club/api";
import { useTournaments } from "@entities/tournament/api";
import { TournamentCard } from "@entities/tournament/ui/TournamentCard";
import { GameCard } from "@entities/game/ui/GameCard";
import { routes } from "@shared/config/routes";
import styles from "./ClubDetailsPage.module.scss";

export const ClubDetailsPage = () => {
  const { clubId } = useParams();
  const id = Number(clubId);
  const { t } = useTranslation();
  const clubQuery = useClub(id);
  const gamesQuery = useClubGames(id);
  const tournamentsQuery = useTournaments();

  if (clubQuery.isPending) return <main className={styles.state}>{t("common.loading")}</main>;
  if (clubQuery.isError || !clubQuery.data) return <main className={styles.state}>{t("clubs.notFound")}</main>;

  const club = clubQuery.data;
  const games = gamesQuery.data ?? [];
  const tournaments = (tournamentsQuery.data ?? [])
    .filter((tournament) => tournament.clubId === id)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

  return (
    <main className={styles.page}>
      <Link className={styles.back} to={routes.clubs}>← {t("clubs.backToClubs")}</Link>

      <header className={styles.clubHeader}>
        <img src={club.logoUrl} alt="" />
        <div>
          <span>{t("clubs.verifiedClub")}</span>
          <h1>{club.name}</h1>
          <p>{club.city} · {club.address}</p>
        </div>
      </header>

      <nav className={styles.tabs} aria-label={t("clubs.clubNavigation")}>
        <NavLink end to={`/clubs/${id}`}>{t("clubs.overview")}</NavLink>
        <NavLink to={`/clubs/${id}/games`}>{t("clubs.games")}</NavLink>
        <NavLink to={`/clubs/${id}/tournaments`}>{t("clubs.tournaments")}</NavLink>
        <NavLink to={`/clubs/${id}/leaderboards`}>{t("clubs.leaderboards")}</NavLink>
      </nav>

      <div className={styles.layout}>
        <div className={styles.mainContent}>
          <section className={styles.about}>
            <p className={styles.sectionLabel}>{t("clubs.aboutLabel")}</p>
            <h2>{t("clubs.about", { name: club.name })}</h2>
            <p>{club.description}</p>
          </section>

          <section className={styles.contentSection}>
            <div className={styles.sectionHeading}>
              <div><p>{t("clubs.libraryLabel")}</p><h2>{t("clubs.availableGames")}</h2></div>
              <Link to={`/clubs/${id}/games`}>{t("clubs.viewAllGames")} →</Link>
            </div>
            {gamesQuery.isPending ? <p>{t("common.loading")}</p> : games.length ? (
              <div className={styles.gameGrid}>{games.slice(0, 4).map((game) => <GameCard key={game.id} game={game} />)}</div>
            ) : <p className={styles.empty}>{t("clubs.noGames")}</p>}
          </section>

          <section className={styles.contentSection}>
            <div className={styles.sectionHeading}>
              <div><p>{t("clubs.eventsLabel")}</p><h2>{t("clubs.upcomingTournaments")}</h2></div>
              <Link to={`/clubs/${id}/tournaments`}>{t("clubs.viewAllTournaments")} →</Link>
            </div>
            {tournamentsQuery.isPending ? <p>{t("common.loading")}</p> : tournaments.length ? (
              <div className={styles.tournamentGrid}>{tournaments.slice(0, 2).map((tournament) => (
                <TournamentCard
                  key={tournament.id}
                  tournament={tournament}
                  clubName={club.name}
                  gameTitle={games.find((game) => game.id === tournament.gameId)?.title}
                />
              ))}</div>
            ) : <p className={styles.empty}>{t("clubs.noTournaments")}</p>}
          </section>
        </div>

        <aside className={styles.contactCard}>
          <p>{t("clubs.visitClub")}</p>
          <dl>
            <div><dt>{t("clubs.address")}</dt><dd>{club.address}, {club.city}</dd></div>
            <div><dt>{t("clubs.hours")}</dt><dd>{club.workingHours ?? "—"}</dd></div>
            <div><dt>{t("clubs.email")}</dt><dd>{club.email ?? "—"}</dd></div>
            <div><dt>{t("clubs.phone")}</dt><dd>{club.phone ?? "—"}</dd></div>
          </dl>
        </aside>
      </div>
    </main>
  );
};
