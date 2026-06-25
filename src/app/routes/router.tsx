import { createBrowserRouter } from "react-router-dom";
import { appAdminRoutes } from "./appAdminRoutes";
import { clubAdminRoutes } from "./clubAdminRoutes";
import { playerRoutes } from "./playerRoutes";
import { publicRoutes } from "./publicRoutes";

export const router = createBrowserRouter([
  publicRoutes,
  playerRoutes,
  clubAdminRoutes,
  appAdminRoutes,
]);
