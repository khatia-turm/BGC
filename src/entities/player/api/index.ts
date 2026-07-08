import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@shared/api/client";
import type { PublicPlayer, PublicPlayerProfile } from "../model/types";

export const playerKeys = {
  all: ["users"] as const,
  list: (search: string) => [...playerKeys.all, "list", { search }] as const,
  detail: (id: number) => [...playerKeys.all, "detail", id] as const,
};

export const getPlayers = (search = "") => {
  const query = `?q=${encodeURIComponent(search.trim())}`;
  return apiClient<PublicPlayer[]>(`/api/users/search${query}`);
};

export const getPlayer = (id: number) =>
  apiClient<PublicPlayerProfile>(`/api/users/${id}`);

export const usePlayers = (search = "") =>
  useQuery({
    queryKey: playerKeys.list(search),
    queryFn: () => getPlayers(search),
  });

export const usePlayer = (id: number) =>
  useQuery({
    queryKey: playerKeys.detail(id),
    queryFn: () => getPlayer(id),
    enabled: Number.isFinite(id),
  });
