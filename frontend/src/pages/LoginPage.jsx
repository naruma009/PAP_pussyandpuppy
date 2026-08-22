import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCommerce } from "../features/commerce/CommerceProvider";
import { usePreferences } from "../features/preferences/PreferenceProvider";

export function loginDestination() {
  const target = sessionStorage.getItem("pap-after-login");
  if (target === "checkout.html" || target === "/checkout") return "/checkout";
  if (target === "/account/orders") return target;
  return "/home";
}

export default function LoginPage() {
  const { customer, login } = useCommerce();
  const { language, playSound, t } = usePreferences();
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  useEffect(() => { document.title = `${t("login")} — pal2paw`; }, [t, language]);
  const submit = async (event) => {
    event.preventDefault(); setSubmitting(true); setStatus("");
    const data = new FormData(event.currentTarget);
    try {
      const nextCustomer = await login({ email: data.get("email"), password: data.get("password") });
      if (!nextCustomer) return;
      playSound("success");
      const destination = loginDestination(); sessionStorage.removeItem("pap-after-login"); navigate(destination, { replace: true });
    } catch (error) { setStatus(error.status === 401 ? t("invalidCredentials") : error.message); } finally { setSubmitting(false); }
  };
  return <form className="form-shell" onSubmit={submit}><span className="eyebrow">pal2paw account</span><h1>{t("loginTitle")}</h1><p>{t("loginIntro")}</p><div className="field"><label htmlFor="email">{t("email")}</label><input id="email" name="email" type="email" required autoComplete="email" /></div><div className="field"><label htmlFor="password">{t("password")}</label><input id="password" name="password" type="password" required autoComplete="current-password" /></div><button className="button" type="submit" disabled={submitting}>{submitting ? t("signingIn") : t("login")}</button><p className="status" role={status ? "alert" : undefined} aria-live="polite">{status}</p><p className="auth-switch">{t("noAccount")} <Link to="/register">{t("register")}</Link></p></form>;
}
