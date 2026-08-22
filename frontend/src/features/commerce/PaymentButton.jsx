import { useState } from "react";
import { createPaymentCheckoutSession } from "../../services/api";
import { usePreferences } from "../preferences/PreferenceProvider";

export default function PaymentButton({ order, onError, redirect = (url) => window.location.assign(url) }) {
  const { t } = usePreferences();
  const [submitting, setSubmitting] = useState(false);
  if (!order || !["unpaid", "failed"].includes(order.paymentStatus)) return null;
  async function startPayment() {
    setSubmitting(true);
    onError?.("");
    try {
      const session = await createPaymentCheckoutSession(order.id);
      redirect(session.checkoutUrl);
    } catch (error) {
      onError?.(error.message);
      setSubmitting(false);
    }
  }
  return <button className="button" type="button" disabled={submitting} onClick={startPayment}>{submitting ? t("startingPayment") : t("payNow")}</button>;
}
