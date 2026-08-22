import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import CustomerGuard from "../features/commerce/CustomerGuard";
import { getCustomerOrder } from "../services/api";
import { usePreferences } from "../features/preferences/PreferenceProvider";

function SuccessContent() {
  const [params] = useSearchParams();
  const { t } = usePreferences();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const orderId = params.get("order_id");
  useEffect(() => {
    document.title = `${t("paymentSuccess")} — pal2paw`;
    if (!orderId) return undefined;
    const controller = new AbortController();
    getCustomerOrder(orderId, controller.signal).then(setOrder).catch((nextError) => {
      if (nextError.name !== "AbortError") setError(nextError.message);
    });
    return () => controller.abort();
  }, [orderId, t]);
  return <section className="container order-confirmation"><span className="eyebrow">pal2paw</span><h1>{t("paymentSuccess")}</h1><p>{t("paymentVerificationPending")}</p>{order && <p>{t("paymentStatus")}: <strong>{order.paymentStatus}</strong></p>}{error && <p role="alert">{error}</p>}</section>;
}

export default function PaymentSuccessPage() {
  return <CustomerGuard returnTo="/payment/success"><SuccessContent /></CustomerGuard>;
}
