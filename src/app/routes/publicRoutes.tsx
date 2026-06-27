import type { RouteObject } from "react-router-dom";
import { PublicLayout } from "@app/layouts/PublicLayout";
import { LoginPage } from "@pages/auth/LoginPage";
import { RegisterPage } from "@pages/auth/RegisterPage";
import { ClubRegisterPage } from "@pages/auth/ClubRegisterPage";
import { ClubDetailsPage } from "@pages/clubs/ClubDetailsPage";
import { ClubGamesPage } from "@pages/clubs/ClubGamesPage";
import { ClubLeaderboardsPage } from "@pages/clubs/ClubLeaderboardsPage";
import { ClubListPage } from "@pages/clubs/ClubListPage";
import { ClubTournamentsPage } from "@pages/clubs/ClubTournamentsPage";
import { GameDetailsPage } from "@pages/games/GameDetailsPage";
import { GameListPage } from "@pages/games/GameListPage";
import { HomePage } from "@pages/home/HomePage";
import { LeaderboardsPage } from "@pages/leaderboards/LeaderboardsPage";
import { PlayerSearchPage } from "@pages/players/PlayerSearchPage";
import { PublicPlayerProfilePage } from "@pages/players/PublicPlayerProfilePage";
import { TournamentDetailsPage } from "@pages/tournaments/TournamentDetailsPage";
import { TournamentListPage } from "@pages/tournaments/TournamentListPage";

export const publicRoutes: RouteObject = {
  path: "/",
  element: <PublicLayout />,
  children: [
    { index: true, element: <HomePage /> },
    { path: "tournaments", element: <TournamentListPage /> },
    { path: "tournaments/:id", element: <TournamentDetailsPage /> },
    { path: "clubs", element: <ClubListPage /> },
    { path: "clubs/:clubId/tournaments", element: <ClubTournamentsPage /> },
    { path: "clubs/:clubId/games", element: <ClubGamesPage /> },
    { path: "clubs/:clubId/leaderboards", element: <ClubLeaderboardsPage /> },
    { path: "clubs/:clubId", element: <ClubDetailsPage /> },
    { path: "games", element: <GameListPage /> },
    { path: "games/:gameId", element: <GameDetailsPage /> },
    { path: "leaderboards", element: <LeaderboardsPage /> },
    { path: "players", element: <PlayerSearchPage /> },
    { path: "players/:playerId", element: <PublicPlayerProfilePage /> },
    { path: "login", element: <LoginPage /> },
    { path: "register", element: <RegisterPage /> },
    { path: "register/club", element: <ClubRegisterPage /> },
  ],
};
