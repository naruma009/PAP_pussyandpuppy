import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import CustomerGuard from "../features/commerce/CustomerGuard";
import { useCommerce } from "../features/commerce/CommerceProvider";
import { orderStatusLabelKey } from "../features/commerce/orderStatus";
import { usePreferences } from "../features/preferences/PreferenceProvider";
import { money } from "../features/catalog/catalog";
import { getCustomerOrders } from "../services/api";

function OrdersContent() {
  const { customer, expireCustomerSession } = useCommerce();
  const { language, t } = usePreferences();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [retry, setRetry] = useState(0);
  const requestVersion = useRef(0);
  useEffect(() => { document.title = `${t("myOrders")} — pal2paw`; }, [language, t]);
  useEffect(() => {
    const version = ++requestVersion.current;
    const controller = new AbortController();
    setStatus("loading"); setError(null);
    getCustomerOrders(controller.signal).then((result) => {
      if (version !== requestVersion.current) return;
      setOrders(result); setStatus("success");
    }).catch((nextError) => {
      if (nextError.name === "AbortError" || version !== requestVersion.current) return;
      if (nextError.status === 401) {
        sessionStorage.setItem("pap-after-login", "/account/orders");
        expireCustomerSession();
        navigate("/login", { replace: true });
        return;
      }
      setError(nextError); setStatus("error");
    });
    return () => { requestVersion.current += 1; controller.abort(); };
  }, [customer.email, expireCustomerSession, navigate, retry]);
  if (status === "loading") return <section className="orders-page container" role="status"><h1>{t("loadingOrders")}</h1></section>;
  if (status === "error") return <section className="orders-page container"><h1>{t("ordersUnavailable")}</h1><p role="alert">{error.message}</p><button className="button" type="button" onClick={() => setRetry((value) => value + 1)}>{t("retry")}</button></section>;
  return <section className="orders-page container"><div className="section-heading"><div><span className="eyebrow">pal2paw account</span><h1>{t("myOrders")}</h1></div></div>{orders.length ? <div className="customer-orders">{orders.map((order) => <article className="customer-order" key={order.id}><div><strong>{order.id}</strong><small>{new Intl.DateTimeFormat(language === "th" ? "th-TH" : "en", { dateStyle: "medium" }).format(new Date(order.createdAt))}</small></div><div className="order-items">{order.items.map((item) => <span key={`${order.id}:${item.productId}`}>{item.name} × {item.qty}</span>)}</div><span className={`order-status status-${order.status}`}>{t(orderStatusLabelKey(order.status))}</span><strong>{money(order.total, language)}</strong></article>)}</div> : <div className="empty-state"><h2>{t("noOrders")}</h2></div>}</section>;
}

export default function CustomerOrdersPage() {
  return <CustomerGuard returnTo="/account/orders"><OrdersContent /></CustomerGuard>;
}
