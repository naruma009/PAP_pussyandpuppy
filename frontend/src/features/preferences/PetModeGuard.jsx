import { Navigate, useLocation } from "react-router-dom";
import { usePreferences } from "./PreferenceProvider";
import { VALID_MODES } from "./storage";

export default function PetModeGuard({ children }) {
  const { petMode } = usePreferences();
  const location = useLocation();
  if (!VALID_MODES.includes(petMode)) {
    return <Navigate replace state={{ from: location.pathname }} to="/" />;
  }
  return children;
}
