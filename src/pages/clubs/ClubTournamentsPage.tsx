import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useClub, useClubGames } from "@entities/club/api";
import { useTournaments } from "@entities/tournament/api";
import { TournamentCard } from "@entities/tournament/ui/TournamentCard";
import styles from "./ClubSubpage.module.scss";

export const ClubTournamentsPage = () => {
  const id = Number(useParams().clubId);
  const { t } = useTranslation();
  const clubQuery = useClub(id);
  const gamesQuery = useClubGames(id);
  const tournamentsQuery = useTournaments();
  const tournaments = (tournamentsQuery.data ?? []).filter((tournament) => tournament.clubId === id);

  if (clubQuery.isPending) return <main className={styles.state}>{t("common.loading")}</main>;
  if (!clubQuery.data) return <main className={styles.state}>{t("clubs.notFound")}</main>;

  return (
    <main className={styles.page}>
      <Link className={styles.back} to={`/clubs/${id}`}>← {clubQuery.data.name}</Link>
      <header className={styles.header}><p>{t("clubs.eventsLabel")}</p><h1>{t("clubs.clubTournaments")}</h1><span>{t("clubs.clubTournamentsDescription")}</span></header>
      {tournamentsQuery.isPending ? <div className={styles.message}>{t("common.loading")}</div> : tournaments.length ? (
        <section className={styles.grid}>{tournaments.map((tournament) => (
          <TournamentCard key={tournament.id} tournament={tournament} clubName={clubQuery.data.name} gameTitle={gamesQuery.data?.find((game) => game.id === tournament.gameId)?.title} />
        ))}</section>
      ) : <div className={styles.message}>{t("clubs.noTournaments")}</div>}
    </main>
  );
};
