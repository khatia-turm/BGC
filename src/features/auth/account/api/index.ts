import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@shared/api/client";

export type ChangePasswordPayload = { currentPassword: string; newPassword: string };

export const changePassword = (payload: ChangePasswordPayload) =>
  apiClient<void>("/api/auth/password", { method: "POST", body: JSON.stringify(payload) });
export const useChangePassword = () => useMutation({ mutationFn: changePassword });
