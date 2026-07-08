import { type FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  useForgotPasswordMutation,
  useLoginMutation,
} from "../api";
import { setAuthSession } from "@shared/auth/session";

export const useLoginForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useLoginMutation();
  const recovery = useForgotPasswordMutation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (recoveryMode) {
      recovery.mutate(email);
      return;
    }
    login.mutate(
      { email, password },
      {
        onSuccess: (response) => {
          setAuthSession(response.token, response.expiresAt, rememberMe);
          const destination = (location.state as { from?: string } | null)?.from ?? "/me/events";
          navigate(destination, { replace: true });
        },
      },
    );
  };

  const openRecovery = () => setRecoveryMode(true);
  const closeRecovery = () => {
    setRecoveryMode(false);
    recovery.reset();
  };

  return {
    email,
    password,
    showPassword,
    recoveryMode,
    rememberMe,
    error: login.error ?? recovery.error,
    isPending: login.isPending || recovery.isPending,
    recoverySent: recovery.isSuccess,
    setEmail,
    setPassword,
    setRememberMe,
    togglePassword: () => setShowPassword((value) => !value),
    openRecovery,
    closeRecovery,
    submit,
  };
};
