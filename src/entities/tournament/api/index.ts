import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@shared/api/client";
import type {
  Tournament,
  MyTournamentRegistration,
  TournamentParticipant,
  TournamentMyRegistration,
  TournamentRegistration,
  TournamentRegistrationStatus,
  TournamentStatus,
  TournamentType,
} from "../model/types";

export const tournamentKeys = {
  all: ["tournaments"] as const,
  list: ["tournaments", "list"] as const,
  adminList: (clubId: number) => ["tournaments", "admin", clubId] as const,
  detail: (id: number) => ["tournaments", "detail", id] as const,
  myRegistrations: ["tournaments", "my-registrations"] as const,
  registration: (id: number) => ["tournaments", "registration", id] as const,
  participants: (id: number) => ["tournaments", "participants", id] as const,
};
export type TournamentPage = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  items: Tournament[];
};
export type MyTournamentRegistrationsPage = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  items: MyTournamentRegistration[];
};
export type TournamentPayload = {
  clubId?: number;
  name: string;
  description: string;
  tournamentType: TournamentType;
  registrationOpensAt: string;
  registrationClosesAt: string;
  cancellationDeadline: string;
  startsAt: string;
  endsAt?: string | null;
  minParticipants: number;
  maxParticipants: number;
  location: string;
  entryFee: number;
  boardGameIds: number[];
};

export const getTournamentPage = async (
  page = 1,
  pageSize = 20,
  clubId?: number,
): Promise<TournamentPage> => {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  if (clubId) params.set("clubId", String(clubId));
  const response = await apiClient<TournamentPage | Tournament[]>(
    `/api/tournaments?${params}`,
  );
  const tournamentPage = Array.isArray(response)
    ? {
        page,
        pageSize,
        totalCount: response.length,
        totalPages: 1,
        items: response,
      }
    : response;

  return {
    ...tournamentPage,
    items: tournamentPage.items.map(normalizeTournament),
  };
};
export const getTournaments = async () =>
  (await getTournamentPage(1, 100)).items;
export const getTournament = (id: number) =>
  apiClient<Tournament>(`/api/tournaments/${id}`).then(normalizeTournament);

const adminTournamentIdsKey = (clubId: number) =>
  `meeplehub:club:${clubId}:admin-tournaments`;

const getStoredAdminTournamentIds = (clubId: number) => {
  if (typeof localStorage === "undefined") return [];
  try {
    const parsed = JSON.parse(
      localStorage.getItem(adminTournamentIdsKey(clubId)) ?? "[]",
    );
    return Array.isArray(parsed)
      ? parsed.filter((id): id is number => Number.isFinite(id))
      : [];
  } catch {
    return [];
  }
};

const storeAdminTournamentIds = (clubId: number, ids: number[]) => {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(
    adminTournamentIdsKey(clubId),
    JSON.stringify([...new Set(ids)]),
  );
};

const rememberAdminTournament = (tournament: Tournament) => {
  storeAdminTournamentIds(tournament.clubId, [
    tournament.id,
    ...getStoredAdminTournamentIds(tournament.clubId),
  ]);
};

export const getAdminTournaments = async (clubId: number) => {
  const publicItems = (await getTournamentPage(1, 100, clubId)).items;
  const hydratedPublicItems = await Promise.all(
    publicItems.map((item) =>
      item.registrationOpensAt && item.registrationClosesAt
        ? item
        : getTournament(item.id).catch(() => item),
    ),
  );
  const publicIds = new Set(publicItems.map((item) => item.id));
  const storedIds = getStoredAdminTournamentIds(clubId).filter(
    (id) => !publicIds.has(id),
  );
  const privateItems = (
    await Promise.all(
      storedIds.map((id) =>
        getTournament(id).catch(() => null as Tournament | null),
      ),
    )
  ).filter(
    (item): item is Tournament => item !== null && item.clubId === clubId,
  );

  const foundPrivateIds = new Set(privateItems.map((item) => item.id));
  storeAdminTournamentIds(clubId, [
    ...hydratedPublicItems.map((item) => item.id),
    ...storedIds.filter((id) => foundPrivateIds.has(id)),
  ]);

  return [...privateItems, ...hydratedPublicItems].sort(
    (first, second) =>
      new Date(first.startsAt).getTime() - new Date(second.startsAt).getTime(),
  );
};

export function useTournaments() {
  return useQuery({
    queryKey: tournamentKeys.list,
    queryFn: getTournaments,
  });
}
export function useAdminTournaments(clubId: number) {
  return useQuery({
    queryKey: tournamentKeys.adminList(clubId),
    queryFn: () => getAdminTournaments(clubId),
    enabled: Number.isFinite(clubId),
  });
}
export function useTournamentPage(page: number, pageSize = 20) {
  return useQuery({
    queryKey: [...tournamentKeys.list, { page, pageSize }],
    queryFn: () => getTournamentPage(page, pageSize),
    placeholderData: (previous) => previous,
  });
}

export const getMyTournamentRegistration = (id: number) =>
  apiClient<Tournament>(`/api/tournaments/${id}`).then(
    (tournament): TournamentMyRegistration | null =>
      tournament.myRegistration ?? null,
  );

export const getMyTournamentRegistrations = async (
  page = 1,
  pageSize = 20,
): Promise<MyTournamentRegistrationsPage> => {
  const response = await apiClient<MyTournamentRegistrationsPage>(
    `/api/tournaments/my-registrations?page=${page}&pageSize=${pageSize}`,
  );

  return {
    ...response,
    items: response.items.map((registration) => ({
      ...registration,
      status: toRegistrationStatus(registration.status),
      waitlistPosition: registration.waitlistPosition ?? null,
      tournamentEndsAt: registration.tournamentEndsAt ?? null,
      location: registration.location ?? null,
      entryFee: registration.entryFee ?? null,
    })),
  };
};

export const registerForTournament = (id: number) =>
  apiClient<TournamentRegistration>(`/api/tournaments/${id}/registrations`, {
    method: "POST",
  }).then(normalizeRegistration);

export const cancelTournamentRegistration = (id: number) =>
  apiClient<void>(`/api/tournaments/${id}/registrations/me`, {
    method: "DELETE",
  });

export const createTournament = (payload: TournamentPayload) =>
  apiClient<Tournament>("/api/tournaments", {
    method: "POST",
    body: JSON.stringify(payload),
  }).then(normalizeTournament);

export const updateTournament = (
  id: number,
  payload: Omit<TournamentPayload, "clubId">,
) =>
  apiClient<void>(`/api/tournaments/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const publishTournament = (id: number) =>
  apiClient<void>(`/api/tournaments/${id}/publish`, { method: "POST" });

export const cancelTournament = (id: number) =>
  apiClient<void>(`/api/tournaments/${id}/cancel`, { method: "POST" });

export function useMyTournamentRegistration(id: number, enabled: boolean) {
  return useQuery({
    queryKey: tournamentKeys.registration(id),
    queryFn: () => getMyTournamentRegistration(id),
    enabled: enabled && Number.isFinite(id),
  });
}

export function useMyTournamentRegistrations(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: [...tournamentKeys.myRegistrations, { page, pageSize }],
    queryFn: () => getMyTournamentRegistrations(page, pageSize),
  });
}

export function useRegisterForTournament(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => registerForTournament(id),
    onSuccess: (registration) => {
      queryClient.setQueryData(tournamentKeys.registration(id), {
        registrationId: registration.id,
        status: registration.status,
        waitlistPosition: registration.waitlistPosition,
        registeredAt: registration.createdAt,
      });
      void queryClient.invalidateQueries({
        queryKey: tournamentKeys.detail(id),
      });
      void queryClient.invalidateQueries({
        queryKey: tournamentKeys.myRegistrations,
      });
      void queryClient.invalidateQueries({ queryKey: ["players"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useCancelTournamentRegistration(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => cancelTournamentRegistration(id),
    onSuccess: () => {
      queryClient.setQueryData(tournamentKeys.registration(id), null);
      void queryClient.invalidateQueries({
        queryKey: tournamentKeys.detail(id),
      });
      void queryClient.invalidateQueries({
        queryKey: tournamentKeys.myRegistrations,
      });
      void queryClient.invalidateQueries({ queryKey: ["players"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useTournament(id: number) {
  return useQuery({
    queryKey: tournamentKeys.detail(id),
    queryFn: () => getTournament(id),
    enabled: Number.isFinite(id),
  });
}

export function useCreateTournament() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTournament,
    onSuccess: (tournament) => {
      rememberAdminTournament(tournament);
      queryClient.setQueryData(tournamentKeys.detail(tournament.id), tournament);
      queryClient.setQueryData<Tournament[]>(
        tournamentKeys.adminList(tournament.clubId),
        (current = []) => [
          tournament,
          ...current.filter((item) => item.id !== tournament.id),
        ],
      );
    },
  });
}

export function useUpdateTournament(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<TournamentPayload, "clubId">) =>
      updateTournament(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tournamentKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: tournamentKeys.all });
    },
  });
}

export function usePublishTournament(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => publishTournament(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tournamentKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: tournamentKeys.all });
    },
  });
}

export function useCancelTournament(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => cancelTournament(id),
    onSuccess: () => {
      const tournament = queryClient.getQueryData<Tournament>(
        tournamentKeys.detail(id),
      );
      if (tournament) rememberAdminTournament(tournament);
      void queryClient.invalidateQueries({ queryKey: tournamentKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: tournamentKeys.all });
    },
  });
}

type LegacyTournament = Tournament & {
  gameId?: number;
  type?: string;
  city?: string;
  venue?: string;
  registeredPlayers?: number;
  maxPlayers?: number;
};

type LegacyRegistration = TournamentRegistration & {
  status: TournamentRegistration["status"] | "Accepted" | "Waitlisted";
  registeredAt?: string;
};

const normalizeTournament = (tournament: LegacyTournament): Tournament => ({
  ...tournament,
  tournamentType:
    tournament.tournamentType ?? toTournamentType(tournament.type),
  status: toTournamentStatus(tournament.status),
  location: tournament.location ?? tournament.venue ?? tournament.city ?? null,
  currentParticipants:
    tournament.currentParticipants ?? tournament.registeredPlayers ?? 0,
  maxParticipants:
    tournament.maxParticipants ?? tournament.maxPlayers ?? 0,
  boardGames:
    tournament.boardGames ??
    (tournament.gameId
      ? [
          {
            boardGameId: tournament.gameId,
            title: "",
            imageUrl: "",
            year: null,
          },
        ]
      : undefined),
  myRegistration: tournament.myRegistration
    ? {
        ...tournament.myRegistration,
        status: toRegistrationStatus(tournament.myRegistration.status),
      }
    : tournament.myRegistration,
});

const normalizeRegistration = (
  registration: LegacyRegistration,
): TournamentRegistration => ({
  ...registration,
  status: toRegistrationStatus(registration.status),
  waitlistPosition: registration.waitlistPosition ?? null,
  createdAt: registration.createdAt ?? registration.registeredAt ?? "",
});

const toTournamentType = (type?: string | number): TournamentType => {
  if (typeof type === "number") return type as TournamentType;
  if (type === "Knockout") return 1;
  if (type === "Multi-stage" || type === "MultiStage") return 2;
  return 0;
};

const toTournamentStatus = (
  status: Tournament["status"] | string,
): TournamentStatus => {
  if (typeof status === "number") return status;
  const statuses = [
    "Draft",
    "Published",
    "RegistrationOpen",
    "RegistrationClosed",
    "InProgress",
    "Finished",
    "Cancelled",
  ];
  const index = statuses.indexOf(status);
  return (index >= 0 ? index : 1) as TournamentStatus;
};

const toRegistrationStatus = (
  status: TournamentRegistrationStatus | string,
): TournamentRegistrationStatus => {
  if (typeof status === "number") return status;
  if (status === "Waitlisted") return 1;
  if (status === "Cancelled") return 2;
  return 0;
};

export const useTournamentParticipants = (id: number) =>
  useQuery({
    queryKey: tournamentKeys.participants(id),
    queryFn: () =>
      apiClient<{ items: TournamentParticipant[] }>(
        `/api/tournaments/${id}/registrations`,
      ).then((page) => page.items),
    enabled: Number.isFinite(id),
  });
