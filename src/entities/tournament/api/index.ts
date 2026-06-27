import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@shared/api/client";
import type { Tournament } from "../model/types";

export const tournamentKeys = {
  all: ["tournaments"] as const,
  list: ["tournaments", "list"] as const,
  detail: (id: number) => ["tournaments", "detail", id] as const,
};

export const getTournaments = () =>
  apiClient<Tournament[]>("/api/tournaments");
export const getTournament = (id: number) =>
  apiClient<Tournament>(`/api/tournaments/${id}`);

export function useTournaments() {
  return useQuery({
    queryKey: tournamentKeys.list,
    queryFn: getTournaments,
  });
}

export function useTournament(id: number) {
  return useQuery({
    queryKey: tournamentKeys.detail(id),
    queryFn: () => getTournament(id),
    enabled: Number.isFinite(id),
  });
}
