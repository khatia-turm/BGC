import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { usePlayer } from "@entities/player/api";
import {
  getTournament,
  tournamentKeys,
  useMyTournamentRegistrations,
} from "@entities/tournament/api";
import type { Tournament } from "@entities/tournament/model/types";
import { getAuthUserId } from "@shared/auth/session";
import { useAuthSession } from "@shared/auth/useAuthSession";
import { routes } from "@shared/config/routes";
import styles from "./PublicPlayerProfilePage.module.scss";

export const PublicPlayerProfilePage = () => {
  const playerId = Number(useParams().playerId);
  const { t } = useTranslation();
  const [now] = useState(() => Date.now());
  const isAuthenticated = useAuthSession();
  const playerQuery = usePlayer(playerId);
  const isOwnProfile = isAuthenticated && getAuthUserId() === playerId;
  const registrationsQuery = useMyTournamentRegistrations(
    1,
    100,
    isOwnProfile,
  );
  const registrations = useMemo(
    () => registrationsQuery.data?.items ?? [],
    [registrationsQuery.data?.items],
  );
  const tournamentDetails = useQueries({
    queries: registrations.map((registration) => ({
      queryKey: tournamentKeys.detail(registration.tournamentId),
      queryFn: () => getTournament(registration.tournamentId),
      enabled: isOwnProfile,
    })),
  });
  const detailsById = useMemo(() => {
    const entries = tournamentDetails
      .map((query) => query.data)
      .filter((tournament): tournament is Tournament => Boolean(tournament))
      .map((tournament) => [tournament.id, tournament] as const);

    return new Map(entries);
  }, [tournamentDetails]);
  const activeRegistrations = useMemo(() => {
    return registrations
      .filter((registration) => {
        const endsAt =
          registration.tournamentEndsAt ?? registration.tournamentStartsAt;

        return new Date(endsAt).getTime() >= now;
      })
      .sort(
        (first, second) =>
          new Date(first.tournamentStartsAt).getTime() -
          new Date(second.tournamentStartsAt).getTime(),
      );
  }, [now, registrations]);
  const playedGames = useMemo(() => {
    const games = activeRegistrations.flatMap(
      (registration) =>
        detailsById.get(registration.tournamentId)?.boardGames ?? [],
    );

    return Array.from(
      new Map(games.map((game) => [game.boardGameId, game])).values(),
    );
  }, [activeRegistrations, detailsById]);

  if (playerQuery.isPending)
    return <main className={styles.state}>{t("common.loading")}</main>;
  if (playerQuery.isError || !playerQuery.data)
    return <main className={styles.state}>{t("playerProfile.notFound")}</main>;

  const player = playerQuery.data;

  return (
    <main className={styles.page}>
      <Link className={styles.back} to={routes.players}>
        &larr; {t("playerProfile.backToPlayers")}
      </Link>
      <header className={styles.profileHeader}>
        <img src={player.avatarUrl ?? ""} alt="" />
        <div>
          <p>{t("playerProfile.publicProfile")}</p>
          <h1>{player.nickname}</h1>
          <strong>
            {player.firstName} {player.lastName}
          </strong>
        </div>
      </header>

      <section
        className={styles.stats}
        aria-label={t("playerProfile.statsLabel")}
      >
        <div>
          <span>Active registrations</span>
          <strong>{isOwnProfile ? activeRegistrations.length : 0}</strong>
        </div>
        <div>
          <span>Games in queue</span>
          <strong>{isOwnProfile ? playedGames.length : 0}</strong>
        </div>
        <div>
          <span>Total registrations</span>
          <strong>{isOwnProfile ? registrations.length : 0}</strong>
        </div>
        <div>
          <span>Profile view</span>
          <strong>{isOwnProfile ? "You" : "Public"}</strong>
        </div>
      </section>

      <div className={styles.contentGrid}>
        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <p>{t("playerProfile.activity")}</p>
            <h2>Active tournaments</h2>
          </div>
          {registrationsQuery.isPending && isOwnProfile ? (
            <div className={styles.empty}>{t("common.loading")}</div>
          ) : activeRegistrations.length ? (
            <div className={styles.tournamentList}>
              {activeRegistrations.map((registration) => {
                const tournament = detailsById.get(registration.tournamentId);

                return (
                  <Link
                    key={registration.registrationId}
                    to={`/tournaments/${registration.tournamentId}`}
                  >
                    <div>
                      <strong>{registration.tournamentName}</strong>
                      <span>{registration.clubName}</span>
                      {tournament?.boardGames?.length ? (
                        <span>
                          {tournament.boardGames
                            .map((game) => game.title)
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      ) : null}
                    </div>
                    <em>{formatRegistrationWindow(tournament)}</em>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className={styles.empty}>
              {isOwnProfile
                ? "No active tournament registrations yet."
                : t("playerProfile.noTournaments")}
            </div>
          )}
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <p>Derived from registrations</p>
            <h2>What this player plays</h2>
          </div>
          {playedGames.length ? (
            <div className={styles.gameList}>
              {playedGames.map((game) => (
                <Link key={game.boardGameId} to={`/games/${game.boardGameId}`}>
                  {game.title || `Game #${game.boardGameId}`}
                </Link>
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              {isOwnProfile
                ? "Register for tournaments to build this list."
                : "Public game activity is not available yet."}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

const formatRegistrationWindow = (tournament?: Tournament) => {
  if (!tournament?.registrationOpensAt && !tournament?.registrationClosesAt) {
    return "View";
  }

  const formatter = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const now = Date.now();
  const opensAt = tournament.registrationOpensAt
    ? new Date(tournament.registrationOpensAt)
    : null;
  const closesAt = tournament.registrationClosesAt
    ? new Date(tournament.registrationClosesAt)
    : null;

  if (opensAt && now < opensAt.getTime()) {
    return `Opens ${formatter.format(opensAt)}`;
  }

  if (closesAt && now <= closesAt.getTime()) {
    return `Closes ${formatter.format(closesAt)}`;
  }

  return closesAt ? `Closed ${formatter.format(closesAt)}` : "Open";
};
