import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { CatalogError, CatalogLoading } from "../components/catalog/CatalogStates";
import { FavoriteButton, ProductVisual, petLabel } from "../components/catalog/ProductCard";
import { money } from "../features/catalog/catalog";
import { useCatalog } from "../features/catalog/CatalogProvider";
import { usePreferences } from "../features/preferences/PreferenceProvider";

export default function ProductDetailPage() {
  const { productId } = useParams();
  const { products, status, retry } = useCatalog();
  const { language, t } = usePreferences();
  const product = products.find((item) => Number(item.id) === Number(productId));
  useEffect(() => {
    document.title = product ? `${product.name} — PAP` : status === "success" ? `${t("productMissing")} — PAP` : `${t("products")} — PAP`;
  }, [product, status, t, language]);
  if (status === "loading") return <section className="detail container"><CatalogLoading detail /></section>;
  if (status === "error") return <section className="detail container"><CatalogError onRetry={retry} /></section>;
  if (!product) return <section className="detail container"><div className="empty-state"><h2>{t("productMissing")}</h2><Link className="button" to="/products">{t("backToProducts")}</Link></div></section>;
  return <section className="detail container"><div className="detail-visual"><ProductVisual product={product} large /></div><div className="detail-copy"><FavoriteButton product={product} detail /><small><span>{product.category}</span> · {petLabel(product.petType, t)}</small><h1>{product.name}</h1><p>{product.description}</p><dl className="product-meta"><div><dt>{t("petType")}</dt><dd>{petLabel(product.petType, t)}</dd></div><div><dt>{t("stock")}</dt><dd>{t("items", { count: product.stock })}</dd></div></dl><strong className="detail-price">{money(product.price, language)}</strong><div className="catalog-detail-cart-slot" aria-hidden="true" /></div></section>;
}
