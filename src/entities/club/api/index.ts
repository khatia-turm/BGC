import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@shared/api/client";
import type { Game } from "@entities/game/model/types";
import type { Club, ClubDashboard, ClubStatus } from "../model/types";

export type ClubFilters = {
  status?: ClubStatus;
  page?: number;
  pageSize?: number;
};
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
export type CreateClubResponse = {
  clubId: number;
  name: string;
  description: string;
  status: "Pending";
  createdAt: string;
  clubAdminId: number;
  message: string;
};
export type MyClubRequest = {
  clubId: number;
  clubName: string;
  status: "Pending" | "Rejected";
  submittedAt: string;
  adminNote: string | null;
};
export type ClubStaffMember = {
  id: number;
  nickname: string;
  email: string;
  avatarUrl: string;
  role: "Admin" | "Moderator";
};

type Page<T> = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  items: T[];
};
export type ClubPage = Page<Club>;
type ClubListDto = {
  clubId: number;
  name: string;
  logoUrl: string;
  description: string;
  city: string;
  status: ClubStatus;
};
type MyClubDto = ClubListDto & { role: "Admin" | "Moderator" };
type ClubDetailDto = {
  clubId: number;
  name: string;
  logoUrl: string;
  description: string;
  address: string;
  city: string;
  email: string;
  phone: string;
  workingHours: string;
  status?: ClubStatus;
};
type CreateClubDto = Omit<CreateClubResponse, "message">;
type UpdateClubDto = {
  clubId: number;
  name: string;
  description: string;
  status: ClubStatus;
  updatedAt: string;
};
type BoardGameDto = {
  boardGameId: number;
  title: string;
  description: string;
  year: number;
  minPlayers: number;
  maxPlayers: number;
  bestPlayersCount: number;
  minPlayerAge: number;
  suggestedPlayerAge: number;
  minPlayingTime: number;
  maxPlayingTime: number;
  complexity: number;
  bggOverallRank: number;
  bggGeekRating: number;
  bggAvgRating: number;
  bggVoters: number;
  imageUrl: string;
  categories: Array<{ id: number; name: string }>;
};
export type AddClubBoardGameResponse = {
  clubId: number;
  boardGameId: number;
  bggId: number;
  title: string;
};
export type UpdateClubStatusResponse = {
  clubId: number;
  previousStatus: ClubStatus;
  status: ClubStatus;
  adminNote: string;
  updatedAt: string;
  deletedAt: string | null;
};

export const clubKeys = {
  all: ["clubs"] as const,
  list: (filters: ClubFilters) => [...clubKeys.all, "list", filters] as const,
  detail: (id: number) => [...clubKeys.all, "detail", id] as const,
  adminDetail: (id: number) => [...clubKeys.detail(id), "my"] as const,
  dashboard: (id: number) => [...clubKeys.detail(id), "dashboard"] as const,
  games: (id: number) => [...clubKeys.detail(id), "boardgames"] as const,
  myRequest: ["clubs", "my"] as const,
  staff: (id: number) => ["clubs", id, "staff"] as const,
};

const toClub = (dto: ClubListDto | ClubDetailDto): Club => ({
  id: dto.clubId,
  name: dto.name,
  logoUrl: dto.logoUrl ?? "",
  description: dto.description ?? "",
  address: "address" in dto ? dto.address : "",
  city: dto.city,
  email: "email" in dto ? dto.email : null,
  phone: "phone" in dto ? dto.phone : null,
  workingHours: "workingHours" in dto ? dto.workingHours : null,
  status: dto.status ?? "Active",
  adminNote: null,
  createdAt: "",
  updatedAt: "",
  deletedAt: null,
});

const toGame = (dto: BoardGameDto): Game => ({
  id: dto.boardGameId,
  bggId: 0,
  title: dto.title,
  description: dto.description,
  year: dto.year,
  minPlayers: dto.minPlayers,
  maxPlayers: dto.maxPlayers,
  minPlayingTime: dto.minPlayingTime,
  maxPlayingTime: dto.maxPlayingTime,
  complexity: dto.complexity,
  type: "Board Game",
  bggOverallRank: dto.bggOverallRank,
  bggGeekRating: dto.bggGeekRating,
  bggAvgRating: dto.bggAvgRating,
  bggVoters: dto.bggVoters,
  bggCommunityPlayerCounts: {
    best: [dto.bestPlayersCount],
    recommended: [],
    notRecommended: [],
  },
  imageUrl: dto.imageUrl,
  categoryIds: dto.categories.map((item) => item.id),
  createdAt: "",
  updatedAt: "",
});

export async function getClubsPage(
  filters: ClubFilters = {},
): Promise<ClubPage> {
  const params = new URLSearchParams({
    page: String(filters.page ?? 1),
    pageSize: String(filters.pageSize ?? 100),
  });
  // Anonymous callers are forbidden from sending a status filter. The public endpoint returns public clubs.
  if (filters.status && filters.status !== "Active")
    params.set("status", filters.status);
  const response = await apiClient<Page<ClubListDto>>(`/api/clubs?${params}`);
  return { ...response, items: response.items.map(toClub) };
}
export const getClubs = async (filters: ClubFilters = {}) =>
  (await getClubsPage(filters)).items;
export const getClub = async (id: number) =>
  toClub(await apiClient<ClubDetailDto>(`/api/clubs/${id}`));
export const getMyClub = async (id: number) =>
  toClub(await apiClient<ClubDetailDto>(`/api/clubs/${id}/my`));
export const getClubGames = async (id: number, search = "") => {
  const params = new URLSearchParams({ page: "1", pageSize: "100" });
  if (search) params.set("search", search);
  const response = await apiClient<Page<BoardGameDto>>(
    `/api/clubs/${id}/boardgames?${params}`,
  );
  return response.items.map(toGame);
};
export const createClub = async (payload: CreateClubPayload) => {
  const response = await apiClient<CreateClubDto>("/api/clubs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return {
    ...response,
    message:
      "Your club request was submitted and is awaiting administrator review.",
  } satisfies CreateClubResponse;
};
export const updateClub = (id: number, payload: CreateClubPayload) =>
  apiClient<UpdateClubDto>(`/api/clubs/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
export const addClubBoardGame = (id: number, bggGameId: number) =>
  apiClient<AddClubBoardGameResponse>(`/api/clubs/${id}/games`, {
    method: "POST",
    body: JSON.stringify({ BggGameId: bggGameId }),
  });
export const removeClubBoardGame = (id: number, boardGameId: number) =>
  apiClient<void>(`/api/clubs/${id}/games/${boardGameId}`, {
    method: "DELETE",
  });
export const updateClubStatus = (
  id: number,
  status: ClubStatus,
  reason: string | null = null,
) =>
  apiClient<UpdateClubStatusResponse>(`/api/clubs/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, reason }),
  });
export const getMyClubRequest = async (): Promise<MyClubRequest | null> => {
  const response = await apiClient<Page<MyClubDto>>(
    "/api/clubs/my?page=1&pageSize=100",
  );
  const request = response.items.find(
    (club) => club.status === "Pending" || club.status === "Rejected",
  );
  return request
    ? {
        clubId: request.clubId,
        clubName: request.name,
        status: request.status as "Pending" | "Rejected",
        submittedAt: "",
        adminNote: null,
      }
    : null;
};

// These calls are retained for screens outside the scope of the Clubs handoff.
export const getClubDashboard = (id: number) =>
  apiClient<ClubDashboard>(`/api/clubs/${id}/dashboard`);
export const getClubStaff = (id: number) =>
  apiClient<ClubStaffMember[]>(`/api/clubs/${id}/staff`);

export function useClubs(filters: ClubFilters = {}) {
  return useQuery({
    queryKey: clubKeys.list(filters),
    queryFn: () => getClubs(filters),
  });
}
export function useClubPage(filters: ClubFilters = {}) {
  return useQuery({
    queryKey: [...clubKeys.list(filters), "page"],
    queryFn: () => getClubsPage(filters),
    placeholderData: (previous) => previous,
  });
}
export function useClub(id: number) {
  return useQuery({
    queryKey: clubKeys.detail(id),
    queryFn: () => getClub(id),
    enabled: Number.isFinite(id),
  });
}
export function useMyClub(id: number) {
  return useQuery({
    queryKey: clubKeys.adminDetail(id),
    queryFn: () => getMyClub(id),
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
export function useClubDashboard(id: number) {
  return useQuery({
    queryKey: clubKeys.dashboard(id),
    queryFn: () => getClubDashboard(id),
    enabled: Number.isFinite(id),
  });
}
export function useClubStaff(id: number) {
  return useQuery({
    queryKey: clubKeys.staff(id),
    queryFn: () => getClubStaff(id),
    enabled: Number.isFinite(id),
  });
}
export function useUpdateClub(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateClubPayload) => updateClub(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clubKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: clubKeys.all });
    },
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
export function useAddClubBoardGame(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bggGameId: number) => addClubBoardGame(id, bggGameId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: clubKeys.games(id) }),
  });
}
export function useRemoveClubBoardGame(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (boardGameId: number) => removeClubBoardGame(id, boardGameId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: clubKeys.games(id) }),
  });
}
export function useUpdateClubStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: number;
      status: ClubStatus;
      reason?: string | null;
    }) => updateClubStatus(id, status, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clubKeys.all }),
  });
}
