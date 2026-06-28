import { type ChangeEvent, type FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRegisterMutation } from "../api";

const initialValues = {
  firstName: "",
  lastName: "",
  nickname: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

export const useRegisterForm = () => {
  const navigate = useNavigate();
  const register = useRegisterMutation();
  const [showPassword, setShowPassword] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [values, setValues] = useState(initialValues);
  const passwordScore = useMemo(
    () =>
      [
        values.password.length >= 8,
        /[A-Z]/.test(values.password),
        /\d/.test(values.password),
        /[^A-Za-z0-9]/.test(values.password),
      ].filter(Boolean).length,
    [values.password],
  );

  const update = (field: keyof typeof values) =>
    (event: ChangeEvent<HTMLInputElement>) =>
      setValues((current) => ({ ...current, [field]: event.target.value }));

  const chooseAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setAvatarUrl(URL.createObjectURL(file));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (values.password !== values.confirmPassword) return;
    register.mutate({
      firstName: values.firstName,
      lastName: values.lastName,
      nickname: values.nickname,
      email: values.email,
      phone: values.phone,
      password: values.password,
    }, {
      onSuccess: (response) => {
        localStorage.setItem("authToken", response.token);
        navigate("/me/profile");
      },
    });
  };

  return {
    values,
    avatarUrl,
    passwordScore,
    passwordsMismatch: Boolean(
      values.confirmPassword && values.password !== values.confirmPassword,
    ),
    error: register.error,
    isPending: register.isPending,
    showPassword,
    update,
    chooseAvatar,
    togglePassword: () => setShowPassword((value) => !value),
    submit,
  };
};
