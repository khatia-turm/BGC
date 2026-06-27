import type { RouteObject } from "react-router-dom";
import { AppAdminLayout } from "@app/layouts/AppAdminLayout";
import { AdminDashboardPage } from "@pages/app-admin/AdminDashboardPage";
import { ClubRequestsPage } from "@pages/app-admin/ClubRequestsPage";
import { ClubsManagementPage } from "@pages/app-admin/ClubsManagementPage";
import { GamesManagementPage } from "@pages/app-admin/GamesManagementPage";
import { UsersManagementPage } from "@pages/app-admin/UsersManagementPage";

export const appAdminRoutes: RouteObject = {
  path: "/admin",
  element: <AppAdminLayout />,
  children: [
    { index: true, element: <AdminDashboardPage /> },
    { path: "club-requests", element: <ClubRequestsPage /> },
    { path: "clubs", element: <ClubsManagementPage /> },
    { path: "users", element: <UsersManagementPage /> },
    { path: "games", element: <GamesManagementPage /> },
  ],
};
