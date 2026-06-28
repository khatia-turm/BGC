import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useForgotPasswordMutation,
  useLoginMutation,
} from "../api";

export const useLoginForm = () => {
  const navigate = useNavigate();
  const login = useLoginMutation();
  const recovery = useForgotPasswordMutation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);

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
          localStorage.setItem("authToken", response.token);
          if (response.expiresAt) {
            localStorage.setItem("authTokenExpiresAt", response.expiresAt);
          }
          navigate("/me/events");
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
    error: login.error ?? recovery.error,
    isPending: login.isPending || recovery.isPending,
    recoverySent: recovery.isSuccess,
    setEmail,
    setPassword,
    togglePassword: () => setShowPassword((value) => !value),
    openRecovery,
    closeRecovery,
    submit,
  };
};
