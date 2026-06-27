import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@shared/api/client";
import type { ClubLeaderboardEntry } from "../model/types";

export type ClubLeaderboardFilters = {
  gameId?: number;
  season?: string;
};

export const getClubLeaderboard = (
  clubId: number,
  filters: ClubLeaderboardFilters = {},
) => {
  const params = new URLSearchParams();
  if (filters.gameId) params.set("gameId", String(filters.gameId));
  if (filters.season) params.set("season", filters.season);
  const query = params.size ? `?${params}` : "";

  return apiClient<ClubLeaderboardEntry[]>(
    `/api/clubs/${clubId}/leaderboards${query}`,
  );
};

export const useClubLeaderboard = (
  clubId: number,
  filters: ClubLeaderboardFilters = {},
) =>
  useQuery({
    queryKey: ["clubs", clubId, "leaderboards", filters],
    queryFn: () => getClubLeaderboard(clubId, filters),
    enabled: Number.isFinite(clubId),
  });
