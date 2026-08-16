import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { money } from "../features/catalog/catalog";
import { useCatalog } from "../features/catalog/CatalogProvider";
import { useCommerce } from "../features/commerce/CommerceProvider";
import { usePreferences } from "../features/preferences/PreferenceProvider";
import { CatalogError } from "../components/catalog/CatalogStates";

export default function CartPage() {
  const { products, status: catalogStatus, retry: retryCatalog } = useCatalog();
  const { cart, cartReady, total, changeQuantity, removeFromCart, announce, customer, customerStatus, retrySession } = useCommerce();
  const { language, t } = usePreferences();
  const navigate = useNavigate();
  useEffect(() => { document.title = `${t("cart")} — PAP`; }, [t, language]);
  const checkout = () => {
    if (!cart.length || customerStatus !== "ready") return;
    if (!customer) { sessionStorage.setItem("pap-after-login", "checkout.html"); navigate("/login"); }
    else navigate("/checkout");
  };
  const change = (id, amount) => { const result = changeQuantity(id, amount); if (result.limited) announce(t("stockLimit")); };
  return <><section className="page-hero container"><span className="eyebrow">Your picks</span><h1>{t("cartTitle")}</h1><p>{t("cartIntro")}</p></section><section className="cart-layout container"><div className="cart-list">{catalogStatus === "error" ? <CatalogError onRetry={retryCatalog} /> : !cartReady ? <div className="catalog-loading" role="status"><span className="sr-only">{t("loadingCart")}</span></div> : !cart.length ? <div className="empty-state"><div className="big-emoji" aria-hidden="true">🛒</div><h2>{t("emptyCart")}</h2><Link className="button" to="/products">{t("browseProducts")}</Link></div> : cart.map((entry, index) => { const product = products.find((item) => item.id === entry.id); if (!product) return null; return <article className="cart-row" key={`${entry.id}:${index}`}><span className="cart-emoji" aria-hidden="true">{product.emoji || "🐾"}</span><div><h3>{product.name}</h3><small>{money(product.price, language)} {t("perItem")}</small></div><div className="quantity"><button type="button" aria-label={`${t("decrease")} ${product.name}`} onClick={() => change(product.id, -1)}>−</button><span>{entry.qty}</span><button type="button" aria-label={`${t("increase")} ${product.name}`} onClick={() => change(product.id, 1)}>＋</button></div><strong>{money(Number(product.price) * entry.qty, language)}</strong><button className="remove" type="button" aria-label={`${t("remove")} ${product.name}`} onClick={() => removeFromCart(product.id)}>×</button></article>; })}</div><aside className="cart-summary"><h2>{t("orderSummary")}</h2><div className="summary-row"><span>{t("total")}</span><strong>{money(total, language)}</strong></div><button className="button" type="button" disabled={!cartReady || !cart.length || customerStatus !== "ready"} onClick={checkout}>{t("checkout")}</button>{customerStatus === "error" && <div className="cart-session-error" role="alert"><p>{t("sessionUnavailable")}</p><button type="button" onClick={retrySession}>{t("retry")}</button></div>}</aside></section></>;
}
