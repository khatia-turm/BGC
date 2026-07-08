import type { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthSession } from "@shared/auth/useAuthSession";

export const AuthRequired = ({ children }: PropsWithChildren) => {
  const authenticated = useAuthSession();
  const location = useLocation();
  return authenticated ? children : <Navigate to="/login" replace state={{ from: location.pathname }} />;
};
