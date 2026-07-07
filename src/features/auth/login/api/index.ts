import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@shared/api/client";

export type LoginPayload = { email: string; password: string };
export type LoginResponse = {
  token: string;
  userId: number;
  nickname: string;
  firstName: string;
  lastName: string;
  expiresAt: string;
};

const login = (payload: LoginPayload) =>
  apiClient<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const useLoginMutation = () => useMutation({ mutationFn: login });
