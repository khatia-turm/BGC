import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@shared/api/client";
import type { PlayerNotification } from "../model/types";
export const useNotifications = () => useQuery({ queryKey:["notifications"], queryFn:()=>apiClient<PlayerNotification[]>("/api/notifications") });
