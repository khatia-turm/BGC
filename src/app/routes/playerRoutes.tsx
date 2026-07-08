import { Navigate, type RouteObject } from "react-router-dom";
import { PlayerLayout } from "@app/layouts/PlayerLayout";
import { MyEventsPage } from "@pages/me/MyEventsPage";
import { MyHistoryPage } from "@pages/me/MyHistoryPage";
import { MyProfilePage } from "@pages/me/MyProfilePage";
import { MyStatsPage } from "@pages/me/MyStatsPage";
import { NotificationsPage } from "@pages/me/NotificationsPage";
import { RoleRequired } from "./RoleRequired";

export const playerRoutes: RouteObject = {
  path: "/me",
  element: (
    <RoleRequired deniedRoles={["AppAdmin"]} fallback="/admin">
      <PlayerLayout />
    </RoleRequired>
  ),
  children: [
    { index: true, element: <Navigate to="events" replace /> },
    { path: "events", element: <MyEventsPage /> },
    { path: "profile", element: <MyProfilePage /> },
    { path: "stats", element: <MyStatsPage /> },
    { path: "history", element: <MyHistoryPage /> },
    { path: "notifications", element: <NotificationsPage /> },
  ],
};
