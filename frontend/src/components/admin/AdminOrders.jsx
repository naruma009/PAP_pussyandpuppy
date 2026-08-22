import { useEffect, useRef, useState } from "react";
import { useAdmin } from "../../features/admin/AdminProvider";
import { formatAdminOrderDate, formatShippingAddress } from "../../features/admin/adminOrders";
import { nextOrderStatuses, orderStatusLabelKey } from "../../features/commerce/orderStatus";
import { money } from "../../features/catalog/catalog";
import { usePreferences } from "../../features/preferences/PreferenceProvider";
import { getAdminOrders, updateAdminOrderStatus } from "../../services/api";

export default function AdminOrders() {
  const { expireAdminSession, loggingOut } = useAdmin();
  const { language, t } = usePreferences();
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [statusUpdateError, setStatusUpdateError] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [retryVersion, setRetryVersion] = useState(0);
  const requestGeneration = useRef(0);

  useEffect(() => {
    const generation = ++requestGeneration.current;
    if (loggingOut) return undefined;
    const controller = new AbortController();
    setStatus("loading"); setError(null);
    getAdminOrders(controller.signal).then((result) => {
      if (controller.signal.aborted || generation !== requestGeneration.current) return;
      setOrders(result); setStatus("success");
    }).catch((nextError) => {
      if (controller.signal.aborted || nextError.name === "AbortError" || generation !== requestGeneration.current) return;
      if (nextError.status === 401) { requestGeneration.current += 1; expireAdminSession(); return; }
      setError(nextError); setStatus("error");
    });
    return () => { requestGeneration.current += 1; controller.abort(); };
  }, [expireAdminSession, loggingOut, retryVersion]);

  async function changeStatus(orderId, nextStatus) {
    setUpdatingOrderId(orderId); setStatusUpdateError(null);
    try {
      const updated = await updateAdminOrderStatus(orderId, nextStatus);
      setOrders((current) => current.map((order) => order.id === orderId ? updated : order));
    } catch (nextError) {
      if (nextError.status === 401) { expireAdminSession(); return; }
      setStatusUpdateError({ orderId, message: nextError.message });
    } finally { setUpdatingOrderId(null); }
  }

  if (status === "loading") return <section className="admin-orders container" aria-labelledby="admin-orders-heading" role="status"><h2 id="admin-orders-heading">{t("loadingAdminOrders")}</h2><button className="button" type="button" onClick={() => setRetryVersion((value) => value + 1)}>{t("retry")}</button></section>;
  if (status === "error") return <section className="admin-orders container" aria-labelledby="admin-orders-heading"><h2 id="admin-orders-heading">{t("adminOrdersUnavailable")}</h2><p role="alert">{error.message}</p><button className="button" type="button" onClick={() => setRetryVersion((value) => value + 1)}>{t("retry")}</button></section>;
  return <section className="admin-orders container" aria-labelledby="admin-orders-heading"><div className="section-heading"><div><span className="eyebrow">pal2paw Admin</span><h2 id="admin-orders-heading">{t("customerOrdersAdmin")}</h2><p>{t("adminOrdersIntro")}</p></div></div>{orders.length ? <ol className="admin-order-list">{orders.map((order) => <li key={order.id}><article className="admin-order"><div className="admin-order-identity"><span>{t("orderId")}</span><strong>{order.id}</strong><span>{t("orderedAt")}</span><time dateTime={order.createdAt}>{formatAdminOrderDate(order.createdAt, language)}</time></div><div className="admin-order-customer"><span>{t("customerDetails")}</span><strong>{order.customer.fullName}</strong><a href={`tel:${order.customer.phone}`}>{order.customer.phone}</a><a href={`mailto:${order.customer.email}`}>{order.customer.email}</a><address><span>{t("shippingAddress")}</span>{formatShippingAddress(order.customer)}</address></div><div className="admin-order-items"><span>{t("orderItems")}</span><ul>{order.items.map((item, index) => <li key={`${order.id}:${item.productId}:${index}`}>{item.name} × {item.qty}</li>)}</ul></div><div className="admin-order-total"><span>{t("orderTotal")}</span><strong>{money(order.total, language)}</strong></div><div className="admin-order-state"><span>{t("orderStatus")}</span><strong className={`order-status status-${order.status}`}>{t(orderStatusLabelKey(order.status))}</strong>{nextOrderStatuses(order.status).length ? <label className="order-status-control"><span>{t("changeOrderStatus")}</span><select aria-label={`${t("changeOrderStatus")} ${order.id}`} value={updatingOrderId === order.id ? order.status : ""} disabled={updatingOrderId === order.id} onChange={(event) => changeStatus(order.id, event.target.value)}><option value="" disabled>{t("selectNextStatus")}</option>{nextOrderStatuses(order.status).map((nextStatus) => <option key={nextStatus} value={nextStatus}>{t(orderStatusLabelKey(nextStatus))}</option>)}</select></label> : <small className="order-terminal">{t("terminalStatus")}</small>}{statusUpdateError?.orderId === order.id && <p className="status" role="alert">{statusUpdateError.message}</p>}</div></article></li>)}</ol> : <div className="empty-state"><p>{t("noAdminOrders")}</p></div>}</section>;
}
