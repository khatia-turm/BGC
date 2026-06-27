import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTournament } from "@entities/tournament/api";
import { useGames } from "@entities/game/api";
import { useClubs } from "@entities/club/api";
import { routes } from "@shared/config/routes";
import styles from "./TournamentDetailsPage.module.scss";

export const TournamentDetailsPage = () => {
  const { id } = useParams();
  const tournamentId = Number(id);
  const { t, i18n } = useTranslation();
  const tournamentQuery = useTournament(tournamentId);
  const { data: games = [] } = useGames();
  const { data: clubs = [] } = useClubs({ status: "Active" });

  if (tournamentQuery.isPending) return <main className={styles.state}>{t("common.loading")}</main>;
  if (tournamentQuery.isError || !tournamentQuery.data) return <main className={styles.state}>{t("tournaments.notFound")}</main>;

  const tournament = tournamentQuery.data;
  const club = clubs.find((item) => item.id === tournament.clubId);
  const game = games.find((item) => item.id === tournament.gameId);
  const isFull = tournament.registeredPlayers >= tournament.maxPlayers;
  const dateFormatter = new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: "long", timeStyle: "short" });
  const capacity = Math.min(100, (tournament.registeredPlayers / tournament.maxPlayers) * 100);

  return (
    <main className={styles.page}>
      <Link className={styles.back} to={routes.tournaments}>← {t("tournaments.backToEvents")}</Link>

      <div className={styles.layout}>
        <article className={styles.mainContent}>
          <div className={styles.badges}>
            <span>{isFull ? t("cards.waitlistOpen") : t("cards.registrationOpen")}</span>
            <span>{tournament.type}</span>
          </div>
          <h1>{tournament.name}</h1>
          <p className={styles.lead}>{tournament.description}</p>

          <section className={styles.infoGrid} aria-label={t("tournaments.eventInformation")}>
            <div><span>{t("cards.date")}</span><strong>{dateFormatter.format(new Date(tournament.startsAt))}</strong></div>
            <div><span>{t("tournaments.ends")}</span><strong>{dateFormatter.format(new Date(tournament.endsAt))}</strong></div>
            <div><span>{t("cards.location")}</span><strong>{tournament.venue}, {tournament.city}</strong></div>
            <div><span>{t("tournaments.game")}</span><strong>{game?.title ?? "—"}</strong></div>
            <div><span>{t("tournaments.hostedBy")}</span><strong>{club?.name ?? "—"}</strong></div>
            <div><span>{t("tournaments.format")}</span><strong>{tournament.type}</strong></div>
          </section>

          <section className={styles.about}>
            <h2>{t("tournaments.aboutTournament")}</h2>
            <p>{t("tournaments.aboutCopy", { game: game?.title ?? t("tournaments.theGame"), type: tournament.type })}</p>
          </section>
        </article>

        <aside className={styles.registrationCard}>
          <p>{t("tournaments.registration")}</p>
          <strong>{isFull ? t("tournaments.eventFull") : t("tournaments.spotsAvailable", { count: tournament.maxPlayers - tournament.registeredPlayers })}</strong>
          <div className={styles.capacityText}>
            <span>{t("cards.players")}</span>
            <span>{tournament.registeredPlayers} / {tournament.maxPlayers}</span>
          </div>
          <div className={styles.progress}><span style={{ width: `${capacity}%` }} /></div>
          <button type="button">{isFull ? t("cards.joinWaitlist") : t("cards.register")}</button>
          <small>{t("tournaments.registrationCloses", { date: new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: "medium" }).format(new Date(tournament.registrationClosesAt)) })}</small>
        </aside>
      </div>
    </main>
  );
};
