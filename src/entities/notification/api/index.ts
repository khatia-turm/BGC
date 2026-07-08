import { useQuery } from "@tanstack/react-query";
import type { PlayerNotification } from "../model/types";

const getNotifications = async (): Promise<PlayerNotification[]> => [];

export const useNotifications = () =>
  useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
  });
