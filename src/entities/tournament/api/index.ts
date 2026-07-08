import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@shared/api/client";
import type { Tournament, TournamentParticipant, TournamentRegistration } from "../model/types";

export const tournamentKeys = {
  all: ["tournaments"] as const,
  list: ["tournaments", "list"] as const,
  detail: (id: number) => ["tournaments", "detail", id] as const,
  registration: (id: number) => ["tournaments", "registration", id] as const,
  participants: (id: number) => ["tournaments", "participants", id] as const,
};

export const getTournaments = () => apiClient<Tournament[]>("/api/tournaments");
export const getTournament = (id: number) =>
  apiClient<Tournament>(`/api/tournaments/${id}`);

export function useTournaments() {
  return useQuery({
    queryKey: tournamentKeys.list,
    queryFn: getTournaments,
  });
}

export const getMyTournamentRegistration = (id: number) =>
  apiClient<TournamentRegistration | null>(
    `/api/tournaments/${id}/registration`,
  );

export const registerForTournament = (id: number) =>
  apiClient<TournamentRegistration>(`/api/tournaments/${id}/registration`, {
    method: "POST",
    body: JSON.stringify({ agreementAccepted: true }),
  });

export const cancelTournamentRegistration = (id: number) =>
  apiClient<void>(`/api/tournaments/${id}/registration`, { method: "DELETE" });

export function useMyTournamentRegistration(id: number, enabled: boolean) {
  return useQuery({
    queryKey: tournamentKeys.registration(id),
    queryFn: () => getMyTournamentRegistration(id),
    enabled: enabled && Number.isFinite(id),
  });
}

export function useRegisterForTournament(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => registerForTournament(id),
    onSuccess: (registration) => {
      queryClient.setQueryData(tournamentKeys.registration(id), registration);
      void queryClient.invalidateQueries({
        queryKey: tournamentKeys.detail(id),
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

export const useTournamentParticipants = (id: number) =>
  useQuery({ queryKey: tournamentKeys.participants(id), queryFn: () => apiClient<TournamentParticipant[]>(`/api/tournaments/${id}/participants`), enabled: Number.isFinite(id) });
