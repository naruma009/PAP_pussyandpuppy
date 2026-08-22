import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCommerce } from "../features/commerce/CommerceProvider";
import { registerCustomer } from "../services/api";
import { usePreferences } from "../features/preferences/PreferenceProvider";

export default function RegisterPage() {
  const { customer, login } = useCommerce();
  const { language, playSound, t } = usePreferences();
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  useEffect(() => { document.title = `${t("register")} — pal2paw`; }, [t, language]);
  const submit = async (event) => {
    event.preventDefault(); setSubmitting(true); setStatus("");
    const data = new FormData(event.currentTarget);
    if (data.get("password") !== data.get("confirmPassword")) { setStatus(t("passwordMismatch")); setSubmitting(false); return; }
    try {
      await registerCustomer({ name: data.get("name"), email: data.get("email"), password: data.get("password") });
      await login({ email: data.get("email"), password: data.get("password") });
      playSound("success");
      const target = sessionStorage.getItem("pap-after-login"); sessionStorage.removeItem("pap-after-login");
      navigate(target === "/checkout" ? "/checkout" : target === "/account/orders" ? target : "/home", { replace: true });
    } catch (error) { setStatus(error.status === 409 ? t("emailRegistered") : error.message); } finally { setSubmitting(false); }
  };
  return <form className="form-shell" onSubmit={submit}><span className="eyebrow">pal2paw account</span><h1>{t("registerTitle")}</h1><p>{t("registerIntro")}</p><div className="field"><label htmlFor="name">{t("name")}</label><input id="name" name="name" required autoComplete="name" /></div><div className="field"><label htmlFor="email">{t("email")}</label><input id="email" name="email" type="email" required autoComplete="email" /></div><div className="field"><label htmlFor="password">{t("password")}</label><input id="password" name="password" type="password" required minLength="8" autoComplete="new-password" /></div><div className="field"><label htmlFor="confirm-password">{t("confirmPassword")}</label><input id="confirm-password" name="confirmPassword" type="password" required minLength="8" autoComplete="new-password" /></div><button className="button" type="submit" disabled={submitting}>{submitting ? t("registering") : t("register")}</button><p className="status" role={status ? "alert" : undefined} aria-live="polite">{status}</p><p className="auth-switch">{t("hasAccount")} <Link to="/login">{t("login")}</Link></p></form>;
}
