import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CatalogEmpty, CatalogError, CatalogLoading } from "../components/catalog/CatalogStates";
import ProductGrid from "../components/catalog/ProductGrid";
import { eligibleProducts } from "../features/catalog/catalog";
import { useCatalog } from "../features/catalog/CatalogProvider";
import { usePreferences } from "../features/preferences/PreferenceProvider";

export default function HomePage() {
  const { products, status, retry } = useCatalog();
  const { petMode, t } = usePreferences();
  const [expanded, setExpanded] = useState(false);
  useEffect(() => { document.title = "PAP — Pussy and Puppy"; }, []);
  const featured = eligibleProducts(products, petMode, true);
  const visible = expanded ? featured : featured.slice(0, 4);
  const toggle = () => { setExpanded((value) => !value); document.querySelector("#featured-products")?.scrollIntoView({ behavior: "smooth", block: "start" }); };
  return <>
    <section className="hero"><div className="container hero-grid"><div><span className="eyebrow">Happy pets, happy home</span><h1>{t("homeTitle")}<br /><span>{t("homeTitleAccent")}</span></h1><p>{t("homeIntro")}</p><div className="hero-actions"><span className="mood-cta-slot" aria-hidden="true" /><Link className="button secondary" to="/products?reset=1#product-grid">{t("viewAllProducts")}</Link></div></div><div className="hero-art" aria-label={t("happyPets")}><div className="blob" /><span className="spark one">✨</span><span className="spark two">★</span><span className="spark three">✦</span><div className="pet-stage"><span className="pet-face">🐱</span><span className="pet-face">🐶</span></div></div></div></section>
    <section className="section featured-section"><div className="container"><div className="section-heading"><div><span className="eyebrow">Paw-picked</span><h2>{t("weeklyFavorites")}</h2></div>{featured.length > 4 && <button className="text-link" type="button" onClick={toggle}>{t(expanded ? "showLess" : "viewAll")}</button>}</div>
      {status === "loading" && <CatalogLoading />}{status === "error" && <CatalogError onRetry={retry} />}{status === "success" && (visible.length ? <div id="featured-products"><ProductGrid products={visible} /></div> : <CatalogEmpty title={t("noFeaturedProducts")} />)}
    </div></section>
    <section className="banner container"><div><h2>{t("bannerTitle")}</h2><p>{t("bannerIntro")}</p></div><Link className="button" to="/login">{t("joinPack")}</Link></section>
  </>;
}
