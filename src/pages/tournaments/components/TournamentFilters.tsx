import { useTranslation } from "react-i18next";
import type { Dispatch, SetStateAction } from "react";
import type { Game } from "@entities/game/model/types";
import type { Club } from "@entities/club/model/types";
import type { TournamentDateFilter } from "../hooks/useTournamentFilters";
import styles from "../TournamentListPage.module.scss";

type TournamentFiltersProps = {
  games: Game[];
  clubs: Club[];
  values: {
    search: string;
    gameId: string;
    clubId: string;
    dateFilter: TournamentDateFilter;
    sortOrder: "asc" | "desc";
  };
  actions: {
    setSearch: Dispatch<SetStateAction<string>>;
    setGameId: Dispatch<SetStateAction<string>>;
    setClubId: Dispatch<SetStateAction<string>>;
    setDateFilter: Dispatch<SetStateAction<TournamentDateFilter>>;
    setSortOrder: Dispatch<SetStateAction<"asc" | "desc">>;
  };
};

export const TournamentFilters = ({
  games,
  clubs,
  values,
  actions,
}: TournamentFiltersProps) => {
  const { t } = useTranslation();

  return (
    <section
      className={styles.filters}
      aria-label={t("tournaments.filtersLabel")}
    >
      <label className={styles.search}>
        <span>{t("tournaments.searchLabel")}</span>
        <input
          value={values.search}
          onChange={(event) => actions.setSearch(event.target.value)}
          placeholder={t("tournaments.searchPlaceholder")}
        />
      </label>
      <label>
        <span>{t("tournaments.gameLabel")}</span>
        <select
          value={values.gameId}
          onChange={(event) => actions.setGameId(event.target.value)}
        >
          <option value="all">{t("tournaments.allGames")}</option>
          {games.map((game) => (
            <option key={game.id} value={game.id}>
              {game.title}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Sort by date</span>
        <select
          value={values.sortOrder}
          onChange={(event) =>
            actions.setSortOrder(event.target.value as "asc" | "desc")
          }
        >
          <option value="asc">Soonest first</option>
          <option value="desc">Latest first</option>
        </select>
      </label>
      <label>
        <span>{t("tournaments.clubLabel")}</span>
        <select
          value={values.clubId}
          onChange={(event) => actions.setClubId(event.target.value)}
        >
          <option value="all">{t("tournaments.allClubs")}</option>
          {clubs.map((club) => (
            <option key={club.id} value={club.id}>
              {club.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>{t("tournaments.dateLabel")}</span>
        <select
          value={values.dateFilter}
          onChange={(event) =>
            actions.setDateFilter(event.target.value as TournamentDateFilter)
          }
        >
          <option value="all">{t("tournaments.anyDate")}</option>
          <option value="upcoming">{t("tournaments.upcoming")}</option>
          <option value="week">{t("tournaments.thisWeek")}</option>
          <option value="month">{t("tournaments.thisMonth")}</option>
        </select>
      </label>
    </section>
  );
};
