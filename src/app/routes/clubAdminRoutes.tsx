import type { RouteObject } from "react-router-dom";
import { ClubAdminLayout } from "@app/layouts/ClubAdminLayout";
import { ClubProfileEditPage } from "@pages/club-admin/ClubProfileEditPage";
import { DashboardPage } from "@pages/club-admin/DashboardPage";
import { EditTournamentPage } from "@pages/club-admin/EditTournamentPage";
import { GameInventoryPage } from "@pages/club-admin/GameInventoryPage";
import { RegistrationRequestsPage } from "@pages/club-admin/RegistrationRequestsPage";
import { StaffPage } from "@pages/club-admin/StaffPage";
import { TournamentBuilderPage } from "@pages/club-admin/TournamentBuilderPage";
import { TournamentsPage } from "@pages/club-admin/TournamentsPage";
import { JoinRequestsPage } from "@pages/club-admin/JoinRequestsPage";

export const clubAdminRoutes: RouteObject = {
  path: "/club-admin/:clubId",
  element: <ClubAdminLayout />,
  children: [
    { index: true, element: <DashboardPage /> },
    { path: "tournaments", element: <TournamentsPage /> },
    { path: "requests", element: <JoinRequestsPage /> },
    { path: "tournaments/new", element: <TournamentBuilderPage /> },
    { path: "tournaments/:id/edit", element: <EditTournamentPage /> },
    {
      path: "tournaments/:id/registrations",
      element: <RegistrationRequestsPage />,
    },
    { path: "games", element: <GameInventoryPage /> },
    { path: "staff", element: <StaffPage /> },
    { path: "profile/edit", element: <ClubProfileEditPage /> },
  ],
};
