import { useTranslation } from "react-i18next";
import styles from "./PlayerProfile.module.scss";

type PlayerStatsProps = {
  stats: {
    ratingPoints: number;
    tournamentsPlayed: number;
    wins: number;
    bestFinish: number | null;
  };
};

export const PlayerStats = ({ stats }: PlayerStatsProps) => {
  const { t } = useTranslation();
  const items = [
    [t("playerProfile.ratingPoints"), stats.ratingPoints.toFixed(1)],
    [t("playerProfile.tournaments"), stats.tournamentsPlayed],
    [t("playerProfile.wins"), stats.wins],
    [
      t("playerProfile.bestFinish"),
      stats.bestFinish ? `#${stats.bestFinish}` : "—",
    ],
  ];

  return (
    <section
      className={styles.stats}
      aria-label={t("playerProfile.statsLabel")}
    >
      {items.map(([label, value]) => (
        <div key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </section>
  );
};
