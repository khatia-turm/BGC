import { QueryProvider } from "./QueryProvider";
import { RouterProvider } from "./RouterProvider";

export const AppProviders = () => (
  <QueryProvider>
    <RouterProvider />
  </QueryProvider>
);
