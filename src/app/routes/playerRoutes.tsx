import type { RouteObject } from "react-router-dom";
import { PlayerLayout } from "@app/layouts/PlayerLayout";
import { MyEventsPage } from "@pages/me/MyEventsPage";
import { MyHistoryPage } from "@pages/me/MyHistoryPage";
import { MyProfilePage } from "@pages/me/MyProfilePage";
import { MyStatsPage } from "@pages/me/MyStatsPage";
import { NotificationsPage } from "@pages/me/NotificationsPage";
import { AuthRequired } from "./AuthRequired";

export const playerRoutes: RouteObject = {
  path: "/me",
  element: <AuthRequired><PlayerLayout /></AuthRequired>,
  children: [
    { path: "events", element: <MyEventsPage /> },
    { path: "profile", element: <MyProfilePage /> },
    { path: "stats", element: <MyStatsPage /> },
    { path: "history", element: <MyHistoryPage /> },
    { path: "notifications", element: <NotificationsPage /> },
  ],
};
