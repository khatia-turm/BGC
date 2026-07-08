import { type ChangeEvent, type FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRegisterMutation } from "../api";
import { ApiError, getApiFieldError } from "@shared/api/client";
import { setAuthSession } from "@shared/auth/session";

const initialValues = {
  firstName: "",
  lastName: "",
  nickname: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  birthday: "",
  gender: "" as "" | "0" | "1" | "2",
};

const passwordRules = [
  {
    message: "Use at least 8 characters.",
    test: (password: string) => password.length >= 8,
  },
  {
    message: "Add at least one uppercase letter.",
    test: (password: string) => /[A-Z]/.test(password),
  },
  {
    message: "Add at least one lowercase letter.",
    test: (password: string) => /[a-z]/.test(password),
  },
  {
    message: "Add at least one number.",
    test: (password: string) => /\d/.test(password),
  },
  {
    message: "Add at least one symbol.",
    test: (password: string) => /[^A-Za-z0-9]/.test(password),
  },
];

const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
export const maximumBirthday = [
  yesterday.getFullYear(),
  String(yesterday.getMonth() + 1).padStart(2, "0"),
  String(yesterday.getDate()).padStart(2, "0"),
].join("-");

export const useRegisterForm = () => {
  const navigate = useNavigate();
  const register = useRegisterMutation();
  const [showPassword, setShowPassword] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [values, setValues] = useState(initialValues);
  const [favoriteGameIds, setFavoriteGameIds] = useState<number[]>([]);
  const passwordScore = useMemo(
    () => passwordRules.filter((rule) => rule.test(values.password)).length,
    [values.password],
  );
  const passwordValid = passwordRules.every((rule) =>
    rule.test(values.password),
  );
  const passwordErrors =
    values.password || submitAttempted
      ? passwordRules
          .filter((rule) => !rule.test(values.password))
          .map((rule) => rule.message)
      : [];
  const getFieldError = (field: keyof typeof values) =>
    getApiFieldError(register.error, field);
  const formError =
    register.error instanceof ApiError && register.error.errors
      ? register.error.message
      : register.error?.message;

  const update =
    (field: keyof typeof values) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setValues((current) => ({ ...current, [field]: event.target.value }));

  const chooseAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setAvatarUrl(URL.createObjectURL(file));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitAttempted(true);
    if (
      !passwordValid ||
      values.password !== values.confirmPassword ||
      values.gender === ""
    )
      return;
    register.mutate(
      {
        firstName: values.firstName,
        lastName: values.lastName,
        nickname: values.nickname,
        email: values.email,
        phone: values.phone,
        password: values.password,
        birthday: new Date(`${values.birthday}T00:00:00Z`).toISOString(),
        gender: Number(values.gender) as 0 | 1 | 2,
      },
      {
        onSuccess: (response) => {
          setAuthSession(response.token, undefined, rememberMe);
          localStorage.setItem(
            "playerPreferences",
            JSON.stringify({ favoriteGameIds }),
          );
          navigate("/me/profile");
        },
      },
    );
  };

  return {
    values,
    avatarUrl,
    passwordScore,
    passwordValid,
    passwordErrors,
    passwordsMismatch: Boolean(
      values.confirmPassword && values.password !== values.confirmPassword,
    ),
    error: formError,
    getFieldError,
    isPending: register.isPending,
    showPassword,
    rememberMe,
    favoriteGameIds,
    update,
    chooseAvatar,
    setRememberMe,
    toggleFavoriteGame: (id: number) =>
      setFavoriteGameIds((games) =>
        games.includes(id)
          ? games.filter((gameId) => gameId !== id)
          : [...games, id],
      ),
    togglePassword: () => setShowPassword((value) => !value),
    submit,
  };
};
