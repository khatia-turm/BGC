import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  useCancelTournamentRegistration,
  useMyTournamentRegistration,
  useRegisterForTournament,
  useTournament,
  useTournamentParticipants,
} from "@entities/tournament/api";
import { useGames } from "@entities/game/api";
import { useClubs } from "@entities/club/api";
import { routes } from "@shared/config/routes";
import { LoginRequiredModal } from "@shared/ui/LoginRequiredModal";
import { useAuthSession } from "@shared/auth/useAuthSession";
import styles from "./TournamentDetailsPage.module.scss";

export const TournamentDetailsPage = () => {
  const { id } = useParams();
  const tournamentId = Number(id);
  const { t, i18n } = useTranslation();
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [pageOpenedAt] = useState(() => Date.now());
  const authenticated = useAuthSession();
  const tournamentQuery = useTournament(tournamentId);
  const participantsQuery = useTournamentParticipants(tournamentId);
  const registrationQuery = useMyTournamentRegistration(
    tournamentId,
    authenticated,
  );
  const registerMutation = useRegisterForTournament(tournamentId);
  const cancelMutation = useCancelTournamentRegistration(tournamentId);
  const { data: games = [] } = useGames();
  const { data: clubs = [] } = useClubs({ status: "Active" });

  if (tournamentQuery.isPending)
    return <main className={styles.state}>{t("common.loading")}</main>;
  if (tournamentQuery.isError || !tournamentQuery.data)
    return <main className={styles.state}>{t("tournaments.notFound")}</main>;

  const tournament = tournamentQuery.data;
  const club = clubs.find((item) => item.id === tournament.clubId);
  const game = games.find((item) => item.id === tournament.gameId);
  const isFull = tournament.registeredPlayers >= tournament.maxPlayers;
  const dateFormatter = new Intl.DateTimeFormat(i18n.resolvedLanguage, {
    dateStyle: "long",
    timeStyle: "short",
  });
  const capacity = Math.min(
    100,
    (tournament.registeredPlayers / tournament.maxPlayers) * 100,
  );
  const requestRegistration = () => {
    if (!authenticated) {
      setLoginPromptOpen(true);
      return;
    }
    if (rulesAccepted) registerMutation.mutate();
  };
  const registration = registrationQuery.data;
  const cancellationOpen = registration
    ? new Date(registration.cancellationClosesAt).getTime() > pageOpenedAt
    : false;

  return (
    <main className={styles.page}>
      <Link className={styles.back} to={routes.tournaments}>
        ← {t("tournaments.backToEvents")}
      </Link>

      <div className={styles.layout}>
        <article className={styles.mainContent}>
          <div className={styles.badges}>
            <span>
              {isFull ? t("cards.waitlistOpen") : t("cards.registrationOpen")}
            </span>
            <span>{tournament.type}</span>
          </div>
          <h1>{tournament.name}</h1>
          <p className={styles.lead}>{tournament.description}</p>

          <section
            className={styles.infoGrid}
            aria-label={t("tournaments.eventInformation")}
          >
            <div>
              <span>{t("cards.date")}</span>
              <strong>
                {dateFormatter.format(new Date(tournament.startsAt))}
              </strong>
            </div>
            <div>
              <span>{t("tournaments.ends")}</span>
              <strong>
                {dateFormatter.format(new Date(tournament.endsAt))}
              </strong>
            </div>
            <div>
              <span>{t("cards.location")}</span>
              <strong>
                {tournament.venue}, {tournament.city}
              </strong>
            </div>
            <div>
              <span>{t("tournaments.game")}</span>
              <strong>{game?.title ?? "—"}</strong>
            </div>
            <div>
              <span>{t("tournaments.hostedBy")}</span>
              <strong>
                {club ? <Link to={`/clubs/${club.id}`}>{club.name}</Link> : "—"}
              </strong>
            </div>
            <div>
              <span>{t("tournaments.format")}</span>
              <strong>{tournament.type}</strong>
            </div>
            <div>
              <span>Entry fee</span>
              <strong>
                {tournament.entryFee != null && tournament.entryFee > 0
                  ? `${tournament.entryFee.toFixed(2)} GEL`
                  : "Free entry"}
              </strong>
            </div>
            <div>
              <span>Waitlist</span>
              <strong>{tournament.waitlistCount ?? 0} players</strong>
            </div>
          </section>

          <section className={styles.about}>
            <h2>Registered players</h2>
            {participantsQuery.data?.length ? (
              <div className={styles.participants}>
                {participantsQuery.data.map((player) => (
                  <Link to={`/players/${player.id}`} key={player.id}>
                    <img src={player.avatarUrl ?? ""} alt="" />
                    <span>{player.nickname}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p>No public participants yet.</p>
            )}
          </section>

          <section className={styles.about}>
            <h2>{t("tournaments.aboutTournament")}</h2>
            <p>
              {t("tournaments.aboutCopy", {
                game: game?.title ?? t("tournaments.theGame"),
                type: tournament.type,
              })}
            </p>
          </section>
        </article>

        <aside className={styles.registrationCard}>
          <p>{t("tournaments.registration")}</p>
          <strong>
            {isFull
              ? t("tournaments.eventFull")
              : t("tournaments.spotsAvailable", {
                  count: tournament.maxPlayers - tournament.registeredPlayers,
                })}
          </strong>
          <div className={styles.capacityText}>
            <span>{t("cards.players")}</span>
            <span>
              {tournament.registeredPlayers} / {tournament.maxPlayers}
            </span>
          </div>
          <div className={styles.progress}>
            <span style={{ width: `${capacity}%` }} />
          </div>
          {registration ? (
            <div className={styles.registrationStatus}>
              <span>
                {registration.status === "Waitlisted"
                  ? t("tournaments.onWaitlist")
                  : t("tournaments.registrationConfirmed")}
              </span>
              <strong>{t("tournaments.confirmationSent")}</strong>
            </div>
          ) : authenticated ? (
            <label className={styles.rulesAgreement}>
              <input
                type="checkbox"
                checked={rulesAccepted}
                onChange={(event) => setRulesAccepted(event.target.checked)}
              />
              <span>{t("tournaments.rulesAgreement")}</span>
            </label>
          ) : null}
          {registration ? (
            <button
              className={styles.cancelButton}
              type="button"
              disabled={!cancellationOpen || cancelMutation.isPending}
              onClick={() => cancelMutation.mutate()}
            >
              {cancelMutation.isPending
                ? t("tournaments.cancelling")
                : t("tournaments.cancelRegistration")}
            </button>
          ) : (
            <button
              type="button"
              disabled={
                authenticated && (!rulesAccepted || registerMutation.isPending)
              }
              onClick={requestRegistration}
            >
              {registerMutation.isPending
                ? t("tournaments.registering")
                : isFull
                  ? t("cards.joinWaitlist")
                  : t("cards.register")}
            </button>
          )}
          {!cancellationOpen && registration && (
            <small>{t("tournaments.cancellationClosed")}</small>
          )}
          {(registerMutation.error || cancelMutation.error) && (
            <small className={styles.registrationError}>
              {(registerMutation.error ?? cancelMutation.error)?.message}
            </small>
          )}
          <small>
            {t("tournaments.registrationCloses", {
              date: new Intl.DateTimeFormat(i18n.resolvedLanguage, {
                dateStyle: "medium",
              }).format(new Date(tournament.registrationClosesAt)),
            })}
          </small>
        </aside>
      </div>
      <LoginRequiredModal
        open={loginPromptOpen}
        onClose={() => setLoginPromptOpen(false)}
      />
    </main>
  );
};
