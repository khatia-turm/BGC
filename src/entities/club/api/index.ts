import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@shared/api/client";
import type { Game } from "@entities/game/model/types";
import type { Club, ClubDashboard, ClubStatus } from "../model/types";

export type ClubFilters = { status?: ClubStatus; ownerId?: number };
export type CreateClubPayload = {
  name: string;
  logoUrl?: string;
  description: string;
  address: string;
  city: string;
  email: string;
  phone: string;
  workingHours: string;
};
export type CreateClubResponse = { clubId: number; status: "Pending"; message: string };
export type MyClubRequest = {
  clubId: number;
  clubName: string;
  status: "Pending" | "Rejected";
  submittedAt: string;
  adminNote: string | null;
};

export const clubKeys = {
  all: ["clubs"] as const,
  list: (filters: ClubFilters) => [...clubKeys.all, "list", filters] as const,
  detail: (id: number) => [...clubKeys.all, "detail", id] as const,
  dashboard: (id: number) => [...clubKeys.detail(id), "dashboard"] as const,
  games: (id: number) => [...clubKeys.detail(id), "games"] as const,
  myRequest: ["clubs", "my-request"] as const,
};

export function getClubs(filters: ClubFilters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.ownerId) params.set("ownerId", String(filters.ownerId));
  const query = params.size ? `?${params}` : "";
  return apiClient<Club[]>(`/api/clubs${query}`);
}

export const getClub = (id: number) => apiClient<Club>(`/api/clubs/${id}`);
export const getClubDashboard = (id: number) =>
  apiClient<ClubDashboard>(`/api/clubs/${id}/dashboard`);
export const getClubGames = (id: number) =>
  apiClient<Game[]>(`/api/clubs/${id}/games`);
export const createClub = (payload: CreateClubPayload) =>
  apiClient<CreateClubResponse>("/api/clubs", { method: "POST", body: JSON.stringify(payload) });
export const getMyClubRequest = () => apiClient<MyClubRequest | null>("/api/clubs/my-request");

export function useClubs(filters: ClubFilters = {}) {
  return useQuery({
    queryKey: clubKeys.list(filters),
    queryFn: () => getClubs(filters),
  });
}

export function useClub(id: number) {
  return useQuery({
    queryKey: clubKeys.detail(id),
    queryFn: () => getClub(id),
    enabled: Number.isFinite(id),
  });
}

export function useClubGames(id: number) {
  return useQuery({
    queryKey: clubKeys.games(id),
    queryFn: () => getClubGames(id),
    enabled: Number.isFinite(id),
  });
}

export function useCreateClub() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createClub,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clubKeys.all }),
  });
}

export function useMyClubRequest() {
  return useQuery({ queryKey: clubKeys.myRequest, queryFn: getMyClubRequest });
}
