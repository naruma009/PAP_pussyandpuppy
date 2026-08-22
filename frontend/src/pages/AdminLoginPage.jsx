import { useState } from "react";
import { useAdmin } from "../features/admin/AdminProvider";
import { usePreferences } from "../features/preferences/PreferenceProvider";

export default function AdminLoginPage() {
  const { login } = useAdmin();
  const { t } = usePreferences();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault(); setSubmitting(true); setError("");
    const data = new FormData(event.currentTarget);
    try { await login({ email: data.get("email"), password: data.get("password") }); }
    catch (nextError) { setError(nextError.status === 401 ? t("invalidAdminCredentials") : nextError.message); }
    finally { setSubmitting(false); }
  };
  return <main id="main" className="admin-state container"><form className="form-shell admin-login-form" onSubmit={submit}><span className="eyebrow">pal2paw Admin</span><h1>{t("adminLogin")}</h1><p>{t("adminLoginIntro")}</p><div className="field"><label htmlFor="admin-email">{t("email")}</label><input id="admin-email" name="email" type="email" required autoComplete="username" /></div><div className="field"><label htmlFor="admin-password">{t("password")}</label><input id="admin-password" name="password" type="password" required autoComplete="current-password" /></div><button className="button" type="submit" disabled={submitting}>{submitting ? t("checkingAdmin") : t("adminLogin")}</button><p className="status" role={error ? "alert" : undefined} aria-live="polite">{error}</p></form></main>;
}
