import { useSyncExternalStore } from "react";
import { isAuthenticated, subscribeToAuthSession } from "./session";

export const useAuthSession = () =>
  useSyncExternalStore(subscribeToAuthSession, isAuthenticated, () => false);
