import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useClubGames } from "@entities/club/api";
import { useCurrentUser } from "@entities/user/api";
import { useAdminTournaments } from "@entities/tournament/api";
import styles from "./ClubAdminPages.module.scss";

export const DashboardPage = () => {
  const { t } = useTranslation();
  const clubId = Number(useParams().clubId);
  const games = useClubGames(clubId);
  const user = useCurrentUser();
  const tournaments = useAdminTournaments(clubId);
  const own = tournaments.data ?? [];
  const active = own.filter((item) => [1, 2, 3, 4].includes(item.status));
  const upcoming = own
    .filter((item) => new Date(item.startsAt) > new Date())
    .slice(0, 4);
  const registeredPlayers = own.reduce(
    (total, item) => total + item.currentParticipants,
    0,
  );

  return (
    <main className={`${styles.page} ${styles.dashboard}`}>
      <header className={styles.dashboardHeading}>
        <h1>{t("clubAdmin.dashboard.title")}</h1>
        <p>
          {t("clubAdmin.dashboard.welcome", {
            nickname: user.data?.nickname ?? "",
          })}
        </p>
      </header>
      <section className={styles.stats}>
        <article className={styles.stat}>
          <span>{t("clubAdmin.dashboard.activeTournaments")}</span>
          <strong>{active.length}</strong>
          <small>
            {t("clubAdmin.dashboard.activeSummary", {
              inProgress: active.filter((tournament) => tournament.status === 4)
                .length,
              upcoming: upcoming.length,
            })}
          </small>
        </article>
        <article className={styles.stat}>
          <span>{t("clubAdmin.dashboard.registeredPlayers")}</span>
          <strong>{registeredPlayers}</strong>
          <small>{t("clubAdmin.dashboard.registeredPlayersHint")}</small>
        </article>
        <article className={styles.stat}>
          <span>{t("clubAdmin.dashboard.gameInventory")}</span>
          <strong className={styles.altNumber}>
            {games.data?.length ?? 0}
          </strong>
          <small>{t("clubAdmin.dashboard.gameInventoryHint")}</small>
        </article>
        <article className={styles.stat}>
          <span>{t("clubAdmin.dashboard.tournaments")}</span>
          <strong>{own.length}</strong>
          <small>{t("clubAdmin.dashboard.tournamentsHint")}</small>
        </article>
      </section>
      <section className={styles.upcoming}>
        <div className={styles.sectionTitle}>
          <h2>{t("clubAdmin.dashboard.upcomingTournaments")}</h2>
          <Link className={styles.button} to="tournaments">
            {t("clubAdmin.dashboard.viewAll")}
          </Link>
        </div>
        <div className={styles.tournamentList}>
          {upcoming.map((item) => (
            <article className={styles.tournamentRow} key={item.id}>
              <div>
                <h3>{item.name}</h3>
                <p>
                  {new Date(item.startsAt).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
                <span className={styles.format}>
                  {t("clubAdmin.dashboard.format", {
                    type: t(`tournamentTypes.${item.tournamentType}`),
                  })}
                </span>
                <span className={styles.spots}>
                  {t("clubAdmin.dashboard.spots", {
                    current: item.currentParticipants,
                    max: item.maxParticipants,
                  })}
                </span>
              </div>
              <Link to={`tournaments/${item.id}/registrations`}>
                {t("clubAdmin.tournaments.viewRegistrations")}
              </Link>
            </article>
          ))}
        </div>
        {!upcoming.length && (
          <div className={styles.dashboardEmpty}>
            <strong>{t("clubAdmin.dashboard.noUpcoming")}</strong>
            <span>{t("clubAdmin.dashboard.noUpcomingHint")}</span>
            <Link className={styles.button} to="tournaments/new">
              {t("clubAdmin.common.createTournament")}
            </Link>
          </div>
        )}
      </section>
    </main>
  );
};
