import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "@shared/api/client";
import type { Game, GameCategory } from "../model/types";

export type GameFilters = {
  search?: string;
  categoryId?: number;
  categoryIds?: number[];
  players?: number;
  sortBy?: "rank";
  sortDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};
type Page<T> = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  items: T[];
};
type BoardGameDto = {
  boardGameId?: number;
  id?: number;
  bggId?: number;
  title: string;
  subtitle?: string;
  description: string;
  year: number;
  minPlayers: number;
  maxPlayers: number;
  bestPlayersCount?: number;
  minPlayerAge?: number;
  suggestedPlayerAge?: number;
  minPlayingTime: number;
  maxPlayingTime: number;
  complexity: number;
  type?: string;
  bggOverallRank: number;
  bggGeekRating: number;
  bggAvgRating: number;
  bggVoters: number;
  imageUrl: string;
  categories?: GameCategory[];
  categoryIds?: number[];
  bggCommunityPlayerCounts?: {
    best: number[];
    recommended: number[];
    notRecommended: number[];
  };
  createdAt?: string;
  updatedAt?: string;
};
export type BggSearchResult = { bggId: number; title: string; year?: number };

export const gameKeys = {
  all: ["boardgames"] as const,
  list: (filters: GameFilters) => ["boardgames", "list", filters] as const,
  detail: (id: number) => ["boardgames", "detail", id] as const,
  categories: ["boardgames", "categories"] as const,
};
const toGame = (dto: BoardGameDto): Game => ({
  id: dto.boardGameId ?? dto.id ?? 0,
  bggId: dto.bggId ?? 0,
  title: dto.title,
  subtitle: dto.subtitle ?? "",
  description: dto.description,
  year: dto.year,
  minPlayers: dto.minPlayers,
  maxPlayers: dto.maxPlayers,
  minPlayingTime: dto.minPlayingTime,
  maxPlayingTime: dto.maxPlayingTime,
  complexity: dto.complexity,
  type: dto.type ?? "Board Game",
  bggOverallRank: dto.bggOverallRank,
  bggGeekRating: dto.bggGeekRating,
  bggAvgRating: dto.bggAvgRating,
  bggVoters: dto.bggVoters,
  bggCommunityPlayerCounts: dto.bggCommunityPlayerCounts ?? {
    best: dto.bestPlayersCount ? [dto.bestPlayersCount] : [],
    recommended: [],
    notRecommended: [],
  },
  imageUrl: dto.imageUrl,
  categoryIds: dto.categoryIds ?? dto.categories?.map((item) => item.id) ?? [],
  createdAt: dto.createdAt ?? "",
  updatedAt: dto.updatedAt ?? "",
});
const itemsOf = <T>(response: Page<T> | T[]): T[] =>
  Array.isArray(response) ? response : response.items;

export async function getGames(filters: GameFilters = {}) {
  const params = new URLSearchParams({
    page: String(filters.page ?? 1),
    pageSize: String(filters.pageSize ?? 100),
  });
  if (filters.search) params.set("search", filters.search);
  const ids =
    filters.categoryIds ?? (filters.categoryId ? [filters.categoryId] : []);
  ids.forEach((id) => params.append("categoryIds", String(id)));
  if (filters.players) params.set("players", String(filters.players));
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  if (filters.sortDirection) params.set("sortDirection", filters.sortDirection);
  const response = await apiClient<Page<BoardGameDto> | BoardGameDto[]>(
    `/api/boardgames?${params}`,
  );
  return itemsOf(response).map(toGame);
}
export const getGame = async (id: number) =>
  toGame(await apiClient<BoardGameDto>(`/api/boardgames/${id}`));
export const getGameCategories = () =>
  apiClient<GameCategory[]>("/api/boardgames/categories");
export const searchBgg = (keyword: string) =>
  apiClient<BggSearchResult[]>("/api/boardgames/bgg-search", {
    method: "POST",
    body: JSON.stringify({ Keyword: keyword }),
  });
export const getBggGame = (bggId: number) =>
  apiClient<BoardGameDto>(`/api/boardgames/bgg-search?bggid=${bggId}`);

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
  return useQuery({
    queryKey: gameKeys.categories,
    queryFn: getGameCategories,
  });
}
export function useBggSearch() {
  return useMutation({ mutationFn: (keyword: string) => searchBgg(keyword) });
}
export function useBggGame(bggId: number | undefined) {
  return useQuery({
    queryKey: ["boardgames", "bgg", bggId],
    queryFn: () => getBggGame(bggId!),
    enabled: Number.isFinite(bggId),
  });
}
