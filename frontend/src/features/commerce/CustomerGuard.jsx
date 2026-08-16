import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCommerce } from "./CommerceProvider";
import { usePreferences } from "../preferences/PreferenceProvider";

export default function CustomerGuard({ children, returnTo = "/home" }) {
  const { customer, customerStatus, sessionError, retrySession } = useCommerce();
  const { t } = usePreferences();
  const navigate = useNavigate();
  useEffect(() => {
    if (customerStatus !== "ready" || customer) return;
    const timer = setTimeout(() => {
      sessionStorage.setItem("pap-after-login", returnTo);
      navigate("/login", { replace: true });
    }, 0);
    return () => clearTimeout(timer);
  }, [customer, customerStatus, navigate, returnTo]);
  if (customerStatus === "error") return <section className="foundation-placeholder container"><h1>{t("sessionUnavailable")}</h1><p>{sessionError?.message}</p><button className="button" type="button" onClick={retrySession}>{t("retry")}</button></section>;
  if (customerStatus !== "ready" || !customer) return <section className="foundation-placeholder container" role="status"><h1>{t("checkingSession")}</h1></section>;
  return children;
}
