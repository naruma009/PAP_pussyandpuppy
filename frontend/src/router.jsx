import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import HealthPage from "./pages/HealthPage";
import MigrationHomePage from "./pages/MigrationHomePage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <MigrationHomePage /> },
      { path: "health", element: <HealthPage /> },
    ],
  },
]);
