import { type FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLoginMutation } from "../api";
import { getApiFieldError } from "@shared/api/client";
import { setAuthSession } from "@shared/auth/session";

export const useLoginForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useLoginMutation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const getFieldError = (field: "email" | "password") =>
    getApiFieldError(login.error, field);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    login.mutate(
      { email, password },
      {
        onSuccess: (response) => {
          setAuthSession(response.token, response.expiresAt, rememberMe);
          const destination =
            (location.state as { from?: string } | null)?.from ??
            (hasJwtRole(response.token, "AppAdmin") ? "/admin" : "/me/events");
          navigate(destination, { replace: true });
        },
      },
    );
  };

  return {
    email,
    password,
    showPassword,
    rememberMe,
    error: login.error,
    getFieldError,
    isPending: login.isPending,
    setEmail,
    setPassword,
    setRememberMe,
    togglePassword: () => setShowPassword((value) => !value),
    submit,
  };
};

function hasJwtRole(token: string, role: string) {
  try {
    const encodedPayload = token.split(".")[1];
    if (!encodedPayload) return false;
    const payload = JSON.parse(
      atob(encodedPayload.replace(/-/g, "+").replace(/_/g, "/")),
    ) as { role?: string | string[]; roles?: string[] };
    const roles = [
      ...(Array.isArray(payload.role) ? payload.role : [payload.role]),
      ...(payload.roles ?? []),
    ].filter(Boolean);
    return roles.includes(role);
  } catch {
    return false;
  }
}
