import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@shared/api/client";

export type RegisterPayload = {
  nickname: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
};

export type RegisterResponse = {
  userId: number;
  token: string;
  message: string;
};

const register = (payload: RegisterPayload) =>
  apiClient<RegisterResponse>("/api/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const useRegisterMutation = () => useMutation({ mutationFn: register });
