import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@shared/api/client";

export type ChangePasswordPayload = { currentPassword: string; newPassword: string };
export type ResetPasswordPayload = { tokenFromEmail: string; newPassword: string };

export const changePassword = (payload: ChangePasswordPayload) =>
  apiClient<void>("/api/auth/password", { method: "POST", body: JSON.stringify(payload) });
export const resetPassword = (payload: ResetPasswordPayload) =>
  apiClient<void>("/api/auth/reset-password", { method: "POST", body: JSON.stringify(payload) });
export const useChangePassword = () => useMutation({ mutationFn: changePassword });
export const useResetPassword = () => useMutation({ mutationFn: resetPassword });
