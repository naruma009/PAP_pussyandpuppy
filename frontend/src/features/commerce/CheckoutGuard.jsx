import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCommerce } from "./CommerceProvider";
import { usePreferences } from "../preferences/PreferenceProvider";
import { useCatalog } from "../catalog/CatalogProvider";
import { CatalogError } from "../../components/catalog/CatalogStates";

export default function CheckoutGuard({ children }) {
  const { customer, customerStatus, sessionError, retrySession, cart, cartReady } = useCommerce();
  const { t } = usePreferences();
  const navigate = useNavigate();
  const { status: catalogStatus, retry: retryCatalog } = useCatalog();
  useEffect(() => {
    if (customerStatus !== "ready" || !cartReady) return;
    if (!customer) { sessionStorage.setItem("pap-after-login", "checkout.html"); navigate("/login", { replace: true }); }
    else if (!cart.length) navigate("/cart", { replace: true });
  }, [customer, customerStatus, cart, cartReady, navigate]);
  if (catalogStatus === "error") return <section className="foundation-placeholder container"><CatalogError onRetry={retryCatalog} /></section>;
  if (customerStatus === "error") return <section className="foundation-placeholder container"><h1>{t("sessionUnavailable")}</h1><p>{sessionError?.message}</p><button className="button" type="button" onClick={retrySession}>{t("retry")}</button></section>;
  if (customerStatus !== "ready" || !cartReady || !customer || !cart.length) return <section className="foundation-placeholder container" role="status"><h1>{t("checkingSession")}</h1></section>;
  return children;
}
