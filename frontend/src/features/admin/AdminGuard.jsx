import AdminLoginPage from "../../pages/AdminLoginPage";
import { usePreferences } from "../preferences/PreferenceProvider";
import { useAdmin } from "./AdminProvider";

export default function AdminGuard({ children }) {
  const { authenticated, status, error, retry } = useAdmin();
  const { t } = usePreferences();
  if (status === "error") return <main id="main" className="admin-state container"><h1>{t("adminSessionError")}</h1><p role="alert">{error.message}</p><button className="button" type="button" onClick={retry}>{t("retry")}</button></main>;
  if (status !== "ready" || !authenticated) return status === "ready" ? <AdminLoginPage /> : <main id="main" className="admin-state container" role="status"><h1>{t("checkingAdmin")}</h1></main>;
  return children;
}
