import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePreferences } from "../preferences/PreferenceProvider";
import { useAdmin } from "./AdminProvider";

export default function AdminGuard({ children }) {
  const { authenticated, status, error, retry } = useAdmin();
  const { t } = usePreferences();
  const navigate = useNavigate();
  useEffect(() => {
    if (status !== "ready" || authenticated) return;
    navigate("/home", { replace: true });
  }, [authenticated, navigate, status]);
  if (status === "error") return <main id="main" className="admin-state container"><h1>{t("adminSessionError")}</h1><p role="alert">{error.message}</p><button className="button" type="button" onClick={retry}>{t("retry")}</button></main>;
  if (status !== "ready" || !authenticated) return <main id="main" className="admin-state container" role="status"><h1>{t("checkingAdmin")}</h1></main>;
  return children;
}
