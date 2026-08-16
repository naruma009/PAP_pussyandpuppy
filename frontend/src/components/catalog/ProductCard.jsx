import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { money } from "../../features/catalog/catalog";
import { useCatalog } from "../../features/catalog/CatalogProvider";
import { usePreferences } from "../../features/preferences/PreferenceProvider";

export function petLabel(type, t) {
  return type === "cat" ? t("forCat") : type === "dog" ? t("forDog") : t("forBoth");
}

export function ProductVisual({ product, large = false }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [product.id, product.image]);
  if (product.image && !failed) return <img className={large ? "product-image-large" : undefined} src={product.image} alt={product.name} onError={() => setFailed(true)} />;
  return <span aria-hidden="true">{product.emoji || "🐾"}</span>;
}

export function FavoriteButton({ product, detail = false }) {
  const { favorites, toggleFavorite } = useCatalog();
  const { t } = usePreferences();
  const active = favorites.includes(Number(product.id));
  return <button className={`favorite-button${detail ? " favorite-button--detail" : ""}`} type="button" aria-pressed={active} aria-label={`${t(active ? "removeFavorite" : "addFavorite")}: ${product.name}`} onClick={() => toggleFavorite(product.id)}><span aria-hidden="true">{active ? "♥" : "♡"}</span></button>;
}

export default function ProductCard({ product }) {
  const { language, t } = usePreferences();
  const petIcon = product.petType === "cat" ? "🐱" : product.petType === "dog" ? "🐶" : "🐾";
  return <article className="product-card" data-product-id={product.id}>
    <Link className="product-visual" to={`/products/${product.id}`} aria-label={`${t("viewProduct")} ${product.name}`}><ProductVisual product={product} /></Link>
    <FavoriteButton product={product} />
    <div className="product-info">
      <small className="product-kicker"><span>{t(`category.${product.category}`)}</span><span className={`pet-badge pet-badge--${product.petType}`}><span aria-hidden="true">{petIcon}</span>{petLabel(product.petType, t)}</span></small>
      <h3><Link to={`/products/${product.id}`}>{product.name}</Link></h3><p>{product.description}</p>
      <div className={`stock${Number(product.stock) <= 0 ? " out" : ""}`}>{Number(product.stock) <= 0 ? t("outStock") : t("inStock", { count: product.stock })}</div>
      <div className="catalog-cart-copy-slot" aria-hidden="true" />
      <div className="product-bottom"><strong>{money(product.price, language)}</strong><span className="catalog-cart-action-slot" aria-hidden="true" /></div>
      <div className="card-feedback" aria-hidden="true" />
    </div>
  </article>;
}
