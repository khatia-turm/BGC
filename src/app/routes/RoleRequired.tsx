import type { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useCurrentUser } from "@entities/user/api";
import { useAuthSession } from "@shared/auth/useAuthSession";
import { getAuthRoles } from "@shared/auth/session";

export const RoleRequired = ({
  role,
  fallback = "/",
  children,
}: PropsWithChildren<{ role: string; fallback?: string }>) => {
  const authenticated = useAuthSession();
  const location = useLocation();
  const user = useCurrentUser(authenticated);

  if (!authenticated)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  if (user.isLoading) return null;

  const roles = new Set([...(user.data?.roles ?? []), ...getAuthRoles()]);
  return roles.has(role) ? <>{children}</> : <Navigate to={fallback} replace />;
};
