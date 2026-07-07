import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useClubPage } from "@entities/club/api";
import { ClubCard } from "@entities/club/ui/ClubCard";
import { Pagination } from "@shared/ui/Pagination";
import { useClubFilters } from "@features/club-list/model/useClubFilters";
import styles from "./ClubListPage.module.scss";

export const ClubListPage = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const clubsQuery = useClubPage({ status: "Active", page, pageSize: 20 });
  const filters = useClubFilters(clubsQuery.data?.items ?? []);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p>{t("clubs.eyebrow")}</p>
        <h1>{t("clubs.title")}</h1>
        <span>{t("clubs.description")}</span>
      </header>

      <section className={styles.filters} aria-label={t("clubs.filtersLabel")}>
        <label>
          <span>{t("clubs.searchLabel")}</span>
          <input
            value={filters.search}
            onChange={(event) => {
              filters.setSearch(event.target.value);
              setPage(1);
            }}
            placeholder={t("clubs.searchPlaceholder")}
          />
        </label>
        <label>
          <span>{t("clubs.cityLabel")}</span>
          <select
            value={filters.city}
            onChange={(event) => {
              filters.setCity(event.target.value);
              setPage(1);
            }}
          >
            <option value="all">{t("clubs.allCities")}</option>
            {filters.cities.map((city) => (
              <option key={city}>{city}</option>
            ))}
          </select>
        </label>
      </section>

      <p className={styles.resultCount}>
        {t("clubs.results", { count: filters.filteredClubs.length })}
      </p>

      {clubsQuery.isPending ? (
        <div className={styles.message}>{t("common.loading")}</div>
      ) : clubsQuery.isError ? (
        <div className={styles.message}>{t("common.loadError")}</div>
      ) : filters.filteredClubs.length ? (
        <section className={styles.grid} aria-label={t("clubs.resultsLabel")}>
          {filters.filteredClubs.map((club) => (
            <ClubCard key={club.id} club={club} />
          ))}
        </section>
      ) : (
        <div className={styles.message}>{t("clubs.noResults")}</div>
      )}
      <Pagination
        page={page}
        totalPages={clubsQuery.data?.totalPages ?? 0}
        isPending={clubsQuery.isFetching}
        onPageChange={setPage}
      />
    </main>
  );
};
