import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  useEffect(() => { document.title = `${t("login")} — PAP`; }, [t, language]);
  useEffect(() => { setStatus(customer ? t("helloDemo", { name: customer.name }) : ""); }, [customer, t]);
  const submit = async (event) => {
    event.preventDefault(); setSubmitting(true); setStatus("");
    const data = new FormData(event.currentTarget);
    try {
      const nextCustomer = await login({ name: data.get("name"), email: data.get("email") });
      if (!nextCustomer) return;
      setStatus(t("loggedIn", { name: nextCustomer.name })); playSound("success");
      const destination = loginDestination(); sessionStorage.removeItem("pap-after-login"); navigate(destination, { replace: true });
    } catch (error) { setStatus(error.message); } finally { setSubmitting(false); }
  };
  return <form className="form-shell" onSubmit={submit}><span className="eyebrow">Welcome to the pack</span><h1>{t("loginTitle")}</h1><p className="demo-note">{t("demoLoginNote")}</p><div className="field"><label htmlFor="name">{t("nickname")}</label><input id="name" name="name" required autoComplete="name" placeholder={t("nicknameExample")} /></div><div className="field"><label htmlFor="email">{t("email")}</label><input id="email" name="email" type="email" required autoComplete="email" placeholder="hello@example.com" /></div><button className="button" type="submit" disabled={submitting}>{submitting ? t("signingIn") : t("demoLogin")}</button><p className="status" aria-live="polite">{status}</p></form>;
}
