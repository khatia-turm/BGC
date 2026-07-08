import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePlayer } from "@entities/player/api";
import { useGames } from "@entities/game/api";
import { routes } from "@shared/config/routes";
import { PlayerStats } from "@entities/player/ui/PlayerStats";
import { PlayerRankings } from "@entities/player/ui/PlayerRankings";
import { PlayerTournaments } from "@entities/player/ui/PlayerTournaments";
import styles from "./PublicPlayerProfilePage.module.scss";

export const PublicPlayerProfilePage = () => {
  const playerId = Number(useParams().playerId);
  const { t } = useTranslation();
  const playerQuery = usePlayer(playerId);
  const { data: games = [] } = useGames();

  if (playerQuery.isPending)
    return <main className={styles.state}>{t("common.loading")}</main>;
  if (playerQuery.isError || !playerQuery.data)
    return <main className={styles.state}>{t("playerProfile.notFound")}</main>;

  const player = playerQuery.data;

  return (
    <main className={styles.page}>
      <Link className={styles.back} to={routes.players}>
        ← {t("playerProfile.backToPlayers")}
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

      <PlayerStats stats={player.stats} />
      <div className={styles.contentGrid}>
        <PlayerRankings rankings={player.rankings} games={games} />
        <PlayerTournaments tournaments={player.tournaments} />
      </div>
    </main>
  );
};
