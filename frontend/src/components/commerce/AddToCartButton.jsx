import { useEffect, useState } from "react";
import { useCommerce } from "../../features/commerce/CommerceProvider";
import { usePreferences } from "../../features/preferences/PreferenceProvider";
import { money } from "../../features/catalog/catalog";

export default function AddToCartButton({ product, detail = false }) {
  const { cart, cartReady, addToCart, announce } = useCommerce();
  const { language, playSound, t } = usePreferences();
  const [feedback, setFeedback] = useState("");
  const qty = cart.find((entry) => entry.id === product.id)?.qty || 0;
  const out = Number(product.stock) <= 0;
  const maxed = out || qty >= Number(product.stock);
  useEffect(() => {
    if (feedback === t("added")) return;
    setFeedback(maxed && !out ? t("stockLimit") : "");
  }, [feedback, maxed, out, t]);
  useEffect(() => {
    if (feedback !== t("added")) return undefined;
    const timer = setTimeout(() => setFeedback(maxed && !out ? t("stockLimit") : ""), 1400);
    return () => clearTimeout(timer);
  }, [feedback, maxed, out, t]);

  const add = () => {
    if (!addToCart(product.id)) { setFeedback(t("stockLimit")); announce(t("stockLimit")); return; }
    setFeedback(t("added")); announce(t("added")); playSound("cart");
  };

  if (detail) return <><div className="in-cart">{qty ? t("inCart", { count: qty }) : t("notInCart")}</div><button className="button add-cart" type="button" disabled={!cartReady || maxed} onClick={add}>{out ? t("outStock") : maxed ? t("stockLimit") : t("addCart")}</button><span className="sr-only" aria-live="polite">{feedback}</span></>;
  return <><div className="in-cart">{qty ? t("inCart", { count: qty }) : t("notInCart")}</div><div className="product-bottom"><strong>{money(product.price, language)}</strong><button className="icon-button add-cart" type="button" disabled={!cartReady || maxed} aria-label={`${t("add")} ${product.name} ${t("toCart")}`} onClick={add}>＋</button></div><div className="card-feedback" aria-live="polite">{feedback}</div></>;
}
