import { Outlet } from "react-router-dom";
import { PublicNavigation } from "@widgets/public-navigation";
import { LanguageSwitcher } from "@shared/ui/LanguageSwitcher";

export const PublicLayout = () => (
  <>
    <PublicNavigation />
    <Outlet />
    <LanguageSwitcher />
  </>
);
