import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import CheckoutGuard from "../features/commerce/CheckoutGuard";
import PaymentButton from "../features/commerce/PaymentButton";
import { useCommerce } from "../features/commerce/CommerceProvider";
import { buildOrderPayload, readCustomer, SHIPPING_FIELDS, writeCustomer } from "../features/commerce/orders";
import { useCatalog } from "../features/catalog/CatalogProvider";
import { money } from "../features/catalog/catalog";
import { usePreferences } from "../features/preferences/PreferenceProvider";
import { createOrder } from "../services/api";

function initialShipping(customer) {
  const saved = readCustomer() || customer || {};
  return Object.fromEntries(SHIPPING_FIELDS.map((field) => [field, field === "fullName" ? customer?.name || saved.fullName || saved.name || "" : field === "email" ? customer?.email || saved.email || "" : saved[field] || ""]));
}

export default function CheckoutPage() {
  const { products, retry: refreshProducts } = useCatalog();
  const commerce = useCommerce();
  const { cart, customer, clearCart } = commerce;
  const { language, playSound, t } = usePreferences();
  const [shipping, setShipping] = useState(() => initialShipping(customer));
  const [completedOrder, setCompletedOrder] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const customerHydrated = useRef(false);
  useEffect(() => { document.title = `${t("checkout")} — pal2paw`; }, [language, t]);
  useEffect(() => {
    if (!customer || customerHydrated.current) return;
    customerHydrated.current = true;
    setShipping(initialShipping(customer));
  }, [customer]);
  const update = (event) => setShipping((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault(); setSubmitting(true); setError("");
    let order;
    try {
      order = await createOrder(buildOrderPayload(commerce.cart, { ...shipping, email: customer.email }));
    } catch (nextError) {
      setError(nextError.message); refreshProducts(); setSubmitting(false); return;
    }
    setCompletedOrder(order);
    try { writeCustomer(shipping); } catch { /* Browser storage is best-effort after a confirmed order. */ }
    clearCart();
    refreshProducts();
    try { playSound("success"); } catch { /* Feedback failure cannot undo a server order. */ }
    setSubmitting(false);
  };
  const previewReady = shipping.address || shipping.province;
  return <CheckoutGuard completed={Boolean(completedOrder)}>{completedOrder ? <section className="order-confirmation container"><div className="big-emoji" aria-hidden="true">✓</div><span className="eyebrow">{t("orderConfirmed")}</span><h1>{t("thanks")}</h1><p>{t("orderPlaced", { id: completedOrder.id })}</p><p>{t("total")} <strong>{money(completedOrder.total, language)}</strong></p><PaymentButton order={completedOrder} onError={setError} />{error && <p className="status" role="alert">{error}</p>}<Link className="button" to="/home">{t("backHome")}</Link></section> : <section className="checkout-shell container"><div className="section-heading"><div><span className="eyebrow">Almost home</span><h1>{t("shippingOrder")}</h1><p>{t("checkoutIntro")}</p></div></div><div className="checkout-layout"><form className="checkout-form" onSubmit={submit}><h2>{t("shipping")}</h2><div className="field"><label htmlFor="full-name">{t("fullName")}</label><input id="full-name" name="fullName" required autoComplete="name" value={shipping.fullName} onChange={update} /></div><div className="form-row"><div className="field"><label htmlFor="phone">{t("phone")}</label><input id="phone" name="phone" type="tel" required autoComplete="tel" value={shipping.phone} onChange={update} /></div><div className="field"><label htmlFor="checkout-email">{t("email")}</label><input id="checkout-email" name="email" type="email" required autoComplete="email" value={shipping.email} onChange={update} /></div></div><div className="field"><label htmlFor="address">{t("address")}</label><textarea id="address" name="address" required autoComplete="street-address" value={shipping.address} onChange={update} /></div><div className="form-row"><div className="field"><label htmlFor="district">{t("district")}</label><input id="district" name="district" required value={shipping.district} onChange={update} /></div><div className="field"><label htmlFor="province">{t("province")}</label><input id="province" name="province" required value={shipping.province} onChange={update} /></div></div><div className="field"><label htmlFor="postal-code">{t("postalCode")}</label><input id="postal-code" name="postalCode" required inputMode="numeric" pattern="[0-9]{5}" autoComplete="postal-code" value={shipping.postalCode} onChange={update} /></div><button className="button" type="submit" disabled={submitting}>{submitting ? t("placingOrder") : t("placeOrder")}</button><p className="status" role={error ? "alert" : undefined} aria-live="polite">{error}</p></form><aside className="order-summary"><h2>{t("orderSummary")}</h2><div>{cart.map((entry, index) => { const product = products.find((item) => item.id === entry.id); return product ? <div className="checkout-item" key={`${entry.id}:${index}`}><span>{product.name} × {entry.qty}</span><strong>{money(Number(product.price) * entry.qty, language)}</strong></div> : null; })}</div><div className="summary-row"><span>{t("total")}</span><strong>{money(commerce.total, language)}</strong></div><div className="shipping-preview"><strong>{t("shipping")}</strong><p>{previewReady ? <>{shipping.fullName}<br />{shipping.address} {shipping.district}<br />{shipping.province} {shipping.postalCode}<br />{shipping.phone}</> : t("addressHint")}</p></div></aside></div></section>}</CheckoutGuard>;
}
