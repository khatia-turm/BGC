import { useState } from "react";
import { usePlatformLeaderboard } from "@entities/leaderboard/api";
import { useGames } from "@entities/game/api";

export const useLeaderboardPage = () => {
  const currentYear = String(new Date().getFullYear());
  const [selectedGameId, setSelectedGameId] = useState<number>();
  const [season, setSeason] = useState(currentYear);
  const gamesQuery = useGames();
  const gameId = selectedGameId ?? gamesQuery.data?.[0]?.id;
  const leaderboardQuery = usePlatformLeaderboard({ gameId, season });

  return {
    games: gamesQuery.data ?? [],
    entries: gameId ? (leaderboardQuery.data ?? []) : [],
    isPending: gamesQuery.isPending || leaderboardQuery.isPending,
    isError: gamesQuery.isError || leaderboardQuery.isError,
    filters: { gameId, season },
    actions: { setSelectedGameId, setSeason },
    seasons: [currentYear, String(Number(currentYear) - 1)],
  };
};
