import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@shared/api/client";
import type {
  CurrentUser,
  ManagedClub,
  PaginatedUsers,
  UpdateUserPayload,
  UserDetail,
  UserProfile,
  UserPublicProfile,
  UserStatus,
} from "../model/types";

export const userKeys = {
  all: ["users"] as const,
  list: (status?: UserStatus, page = 1, pageSize = 50) =>
    [...userKeys.all, "list", { status, page, pageSize }] as const,
  detail: (id: number) => [...userKeys.all, "detail", id] as const,
  me: ["auth", "me"] as const,
};

export const getCurrentUser = () => apiClient<CurrentUser>("/api/auth/me");

export function getUsers(status?: UserStatus, page = 1, pageSize = 50) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (status) params.set("status", status);
  return apiClient<PaginatedUsers>(`/api/users?${params}`);
}

export const searchUsers = (query: string) =>
  apiClient<UserPublicProfile[]>(`/api/users/search?q=${encodeURIComponent(query.trim())}`);

export const getUser = (id: number) => apiClient<UserProfile>(`/api/users/${id}`);
export const getUserClubs = (id: number) =>
  apiClient<Pick<ManagedClub, "id" | "name" | "role">[]>(`/api/users/${id}/clubs`);
export const updateUser = (id: number, payload: UpdateUserPayload) =>
  apiClient<UserDetail>(`/api/users/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
export const updateUserStatus = (id: number, status: UserStatus, reason?: string) =>
  apiClient<UserDetail>(`/api/users/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, reason }),
  });
export const deactivateCurrentUser = () =>
  apiClient<void>("/api/users/me", { method: "DELETE" });

export const useCurrentUser = (enabled = true) =>
  useQuery({ queryKey: userKeys.me, queryFn: getCurrentUser, enabled });
export const useUsers = (status?: UserStatus, page = 1, pageSize = 50) =>
  useQuery({ queryKey: userKeys.list(status, page, pageSize), queryFn: () => getUsers(status, page, pageSize) });
export const useUser = (id: number) =>
  useQuery({ queryKey: userKeys.detail(id), queryFn: () => getUser(id), enabled: Number.isInteger(id) && id > 0 });
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: ({ id, payload }: { id: number; payload: UpdateUserPayload }) => updateUser(id, payload), onSuccess: () => void queryClient.invalidateQueries({ queryKey: userKeys.all }) });
};
export const useDeactivateCurrentUser = () => useMutation({ mutationFn: deactivateCurrentUser });
