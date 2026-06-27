import { Outlet } from "react-router-dom";
import { PublicNavigation } from "@widgets/public-navigation";

export const PublicLayout = () => (
  <>
    <PublicNavigation />
    <Outlet />
  </>
);
