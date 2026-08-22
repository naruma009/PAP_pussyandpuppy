import { useEffect } from "react";
import { Link } from "react-router-dom";
import { usePreferences } from "../features/preferences/PreferenceProvider";

export default function PaymentCancelPage() {
  const { t } = usePreferences();
  useEffect(() => { document.title = `${t("paymentCancelled")} — pal2paw`; }, [t]);
  return <section className="container order-confirmation"><span className="eyebrow">pal2paw</span><h1>{t("paymentCancelled")}</h1><p>{t("paymentNotCompleted")}</p><Link className="button" to="/account/orders">{t("backToOrders")}</Link></section>;
}
