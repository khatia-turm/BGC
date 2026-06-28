import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@shared/api/client";
import type { Game, GameCategory } from "../model/types";

export type GameFilters = { search?: string; categoryId?: number; clubId?: number };

export const gameKeys = {
  all: ["games"] as const,
  list: (filters: GameFilters) => [...gameKeys.all, "list", filters] as const,
  detail: (id: number) => [...gameKeys.all, "detail", id] as const,
  categories: ["games", "categories"] as const,
};

export function getGames(filters: GameFilters = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.categoryId) params.set("categoryId", String(filters.categoryId));
  if (filters.clubId) params.set("clubId", String(filters.clubId));
  const query = params.size ? `?${params}` : "";
  return apiClient<Game[]>(`/api/games${query}`);
}

export const getGame = (id: number) => apiClient<Game>(`/api/games/${id}`);
export const getGameCategories = () =>
  apiClient<GameCategory[]>("/api/games/categories");

export function useGames(filters: GameFilters = {}) {
  return useQuery({
    queryKey: gameKeys.list(filters),
    queryFn: () => getGames(filters),
  });
}

export function useGame(id: number) {
  return useQuery({
    queryKey: gameKeys.detail(id),
    queryFn: () => getGame(id),
    enabled: Number.isFinite(id),
  });
}

export function useGameCategories() {
  return useQuery({ queryKey: gameKeys.categories, queryFn: getGameCategories });
}
