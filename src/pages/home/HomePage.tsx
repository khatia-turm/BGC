import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { routes } from "@shared/config/routes";
import { useTournaments } from "@entities/tournament/api";
import { TournamentCard } from "@entities/tournament/ui/TournamentCard";
import { useClubs } from "@entities/club/api";
import { ClubCard } from "@entities/club/ui/ClubCard";
import { useGames } from "@entities/game/api";
import { GameCard } from "@entities/game/ui/GameCard";
import { useAuthSession } from "@shared/auth/useAuthSession";
import styles from "./HomePage.module.scss";

export const HomePage = () => {
  const { t } = useTranslation();
  const authenticated = useAuthSession();
  const tournamentsQuery = useTournaments();
  const clubsQuery = useClubs({ status: "Active" });
  const gamesQuery = useGames({ sortBy: "rank", sortDirection: "asc" });

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.content}>
          <p className={styles.eyebrow}>{t("home.eyebrow")}</p>
          <h1 className={styles.title}>{t("home.title")}</h1>
          <p className={styles.description}>{t("home.description")}</p>

          <div className={styles.actions}>
            {!authenticated && (
              <Link className={styles.primaryAction} to={routes.register}>
                {t("home.registerCta")}
              </Link>
            )}
            <Link className={styles.secondaryAction} to={routes.tournaments}>
              {t("home.eventsCta")}
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          <ul
            className={styles.highlights}
            aria-label={t("home.highlightsLabel")}
          >
            <li>{t("home.highlightClubs")}</li>
            <li>{t("home.highlightEvents")}</li>
            <li>{t("home.highlightPlayers")}</li>
          </ul>
        </div>

        <div className={styles.visual} aria-hidden="true">
          <div className={styles.glow} />
          <div className={`${styles.cardBack} ${styles.cardBackLeft}`}>
            <span>♟</span>
          </div>
          <div className={`${styles.cardBack} ${styles.cardBackRight}`}>
            <span>◆</span>
          </div>
          <div className={styles.gameCard}>
            <span className={styles.cardLabel}>{t("home.cardLabel")}</span>
            <strong>{t("home.cardTitle")}</strong>
            <div className={styles.cardMeta}>
              <span>{t("home.cardPlace")}</span>
              <span>{t("home.cardPlayers")}</span>
            </div>
            <div className={styles.playerDots}>
              <span />
              <span />
              <span />
              <span className={styles.morePlayers}>+8</span>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.previews}>
        <section
          className={styles.previewSection}
          aria-labelledby="upcoming-events-title"
        >
          <div className={styles.sectionHeading}>
            <div>
              <p>{t("home.eventsEyebrow")}</p>
              <h2 id="upcoming-events-title">{t("home.upcomingEvents")}</h2>
            </div>
            <Link to={routes.tournaments}>
              {t("home.viewAllEvents")} <span aria-hidden="true">→</span>
            </Link>
          </div>
          {tournamentsQuery.isPending ? (
            <div className={styles.loadingCard}>{t("common.loading")}</div>
          ) : tournamentsQuery.isError ? (
            <p className={styles.message}>{t("common.loadError")}</p>
          ) : tournamentsQuery.data.length ? (
            <div className={styles.cardRow}>
              {tournamentsQuery.data.slice(0, 3).map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} />
              ))}
            </div>
          ) : (
            <p className={styles.message}>{t("home.noEvents")}</p>
          )}
        </section>

        <section
          className={styles.previewSection}
          aria-labelledby="clubs-title"
        >
          <div className={styles.sectionHeading}>
            <div>
              <p>{t("home.clubsEyebrow")}</p>
              <h2 id="clubs-title">{t("home.featuredClubs")}</h2>
            </div>
            <Link to={routes.clubs}>
              {t("home.viewAllClubs")} <span aria-hidden="true">→</span>
            </Link>
          </div>
          {clubsQuery.isPending ? (
            <div className={styles.loadingCard}>{t("common.loading")}</div>
          ) : clubsQuery.isError ? (
            <p className={styles.message}>{t("common.loadError")}</p>
          ) : clubsQuery.data.length ? (
            <div className={styles.cardRow}>
              {clubsQuery.data.slice(0, 3).map((club) => (
                <ClubCard key={club.id} club={club} />
              ))}
            </div>
          ) : (
            <p className={styles.message}>{t("home.noClubs")}</p>
          )}
        </section>

        <section
          className={styles.previewSection}
          aria-labelledby="games-title"
        >
          <div className={styles.sectionHeading}>
            <div>
              <p>{t("home.gamesEyebrow")}</p>
              <h2 id="games-title">{t("home.findGames")}</h2>
            </div>
            <Link to={routes.games}>
              {t("home.viewAllGames")} <span aria-hidden="true">→</span>
            </Link>
          </div>
          {gamesQuery.isPending ? (
            <div className={styles.loadingCard}>{t("common.loading")}</div>
          ) : gamesQuery.isError ? (
            <p className={styles.message}>{t("common.loadError")}</p>
          ) : gamesQuery.data.length ? (
            <div className={styles.cardRow}>
              {gamesQuery.data.slice(0, 3).map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          ) : (
            <p className={styles.message}>{t("home.noGames")}</p>
          )}
        </section>
      </div>
    </main>
  );
};
