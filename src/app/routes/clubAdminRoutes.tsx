import type { RouteObject } from "react-router-dom";
import { ClubAdminLayout } from "@app/layouts/ClubAdminLayout";
import { ClubProfileEditPage } from "@pages/club-admin/ClubProfileEditPage";
import { DashboardPage } from "@pages/club-admin/DashboardPage";
import { EditTournamentPage } from "@pages/club-admin/EditTournamentPage";
import { GameInventoryPage } from "@pages/club-admin/GameInventoryPage";
import { ManageTournamentPage } from "@pages/club-admin/ManageTournamentPage";
import { ParticipantsPage } from "@pages/club-admin/ParticipantsPage";
import { RegistrationRequestsPage } from "@pages/club-admin/RegistrationRequestsPage";
import { ResultsPage } from "@pages/club-admin/ResultsPage";
import { RoundsTablesPage } from "@pages/club-admin/RoundsTablesPage";
import { StaffPage } from "@pages/club-admin/StaffPage";
import { StagesPage } from "@pages/club-admin/StagesPage";
import { StandingsPage } from "@pages/club-admin/StandingsPage";
import { TournamentBuilderPage } from "@pages/club-admin/TournamentBuilderPage";
import { TournamentMessagesPage } from "@pages/club-admin/TournamentMessagesPage";
import { TournamentStructurePage } from "@pages/club-admin/TournamentStructurePage";
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
    { path: "tournaments/:id", element: <ManageTournamentPage /> },
    { path: "tournaments/:id/edit", element: <EditTournamentPage /> },
    {
      path: "tournaments/:id/registrations",
      element: <RegistrationRequestsPage />,
    },
    { path: "tournaments/:id/participants", element: <ParticipantsPage /> },
    { path: "tournaments/:id/structure", element: <TournamentStructurePage /> },
    { path: "tournaments/:id/stages", element: <StagesPage /> },
    { path: "tournaments/:id/rounds", element: <RoundsTablesPage /> },
    { path: "tournaments/:id/results", element: <ResultsPage /> },
    { path: "tournaments/:id/standings", element: <StandingsPage /> },
    { path: "tournaments/:id/messages", element: <TournamentMessagesPage /> },
    { path: "games", element: <GameInventoryPage /> },
    { path: "staff", element: <StaffPage /> },
    { path: "profile/edit", element: <ClubProfileEditPage /> },
  ],
};
