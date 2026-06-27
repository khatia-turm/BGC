import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useClub, useClubGames } from "@entities/club/api";
import { GameCard } from "@entities/game/ui/GameCard";
import styles from "./ClubSubpage.module.scss";

export const ClubGamesPage = () => {
  const id = Number(useParams().clubId);
  const { t } = useTranslation();
  const clubQuery = useClub(id);
  const gamesQuery = useClubGames(id);
  const [search, setSearch] = useState("");
  const games = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (gamesQuery.data ?? []).filter((game) => !term || game.title.toLowerCase().includes(term));
  }, [gamesQuery.data, search]);

  if (clubQuery.isPending) return <main className={styles.state}>{t("common.loading")}</main>;
  if (!clubQuery.data) return <main className={styles.state}>{t("clubs.notFound")}</main>;

  return (
    <main className={styles.page}>
      <Link className={styles.back} to={`/clubs/${id}`}>← {clubQuery.data.name}</Link>
      <header className={styles.header}><p>{t("clubs.libraryLabel")}</p><h1>{t("clubs.clubGames")}</h1><span>{t("clubs.clubGamesDescription")}</span></header>
      <div className={styles.toolbar}><label><span>{t("clubs.searchGames")}</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("clubs.searchGamesPlaceholder")} /></label></div>
      {gamesQuery.isPending ? <div className={styles.message}>{t("common.loading")}</div> : games.length ? (
        <section className={`${styles.grid} ${styles.gameGrid}`}>{games.map((game) => <GameCard key={game.id} game={game} />)}</section>
      ) : <div className={styles.message}>{t("clubs.noGames")}</div>}
    </main>
  );
};
