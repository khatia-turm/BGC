import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@shared/api/client";

export type LoginPayload = { email: string; password: string };
export type LoginResponse = {
  token: string;
  expiresAt?: string;
  user: { id: number; nickname: string };
};

const login = (payload: LoginPayload) =>
  apiClient<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

const forgotPassword = (email: string) =>
  apiClient<{ message: string }>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

export const useLoginMutation = () => useMutation({ mutationFn: login });
export const useForgotPasswordMutation = () =>
  useMutation({ mutationFn: forgotPassword });
