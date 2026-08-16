import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAdmin } from "../../features/admin/AdminProvider";
import { usePreferences } from "../../features/preferences/PreferenceProvider";
import PreferenceControls from "../layout/PreferenceControls";

export default function AdminAppShell({ children }) {
  const { logout } = useAdmin();
  const { t } = usePreferences();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const leave = async () => {
    setSubmitting(true); setError("");
    try { if (await logout()) navigate("/home", { replace: true }); }
    catch (nextError) { setError(nextError.message); }
    finally { setSubmitting(false); }
  };
  return <div className="admin-app"><header className="site-header"><nav className="nav container" aria-label={t("adminNavigation")}><NavLink className="logo" to="/home"><span className="logo-mark">P</span>PAP Admin</NavLink><div className="admin-nav-actions"><PreferenceControls /><button className="ghost-button" type="button" disabled={submitting} onClick={leave}>{t(submitting ? "loggingOutAdmin" : "logoutAdmin")}</button></div></nav></header><main id="main">{children}</main>{error && <p className="admin-shell-error" role="alert">{error}</p>}</div>;
}
