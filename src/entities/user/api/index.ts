import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@shared/api/client";
import type { CurrentUser, User, UserStatus } from "../model/types";

export const userKeys = {
  all: ["users"] as const,
  list: (status?: UserStatus) => [...userKeys.all, "list", { status }] as const,
  detail: (id: number) => [...userKeys.all, "detail", id] as const,
  me: ["auth", "me"] as const,
};

export function getCurrentUser() {
  return apiClient<CurrentUser>("/api/auth/me");
}

export function getUsers(status?: UserStatus) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiClient<User[]>(`/api/users${query}`);
}

export function getUser(id: number) {
  return apiClient<User>(`/api/users/${id}`);
}

export function useCurrentUser() {
  return useQuery({ queryKey: userKeys.me, queryFn: getCurrentUser });
}

export function useUsers(status?: UserStatus) {
  return useQuery({
    queryKey: userKeys.list(status),
    queryFn: () => getUsers(status),
  });
}

export function useUser(id: number) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => getUser(id),
    enabled: Number.isFinite(id),
  });
}
