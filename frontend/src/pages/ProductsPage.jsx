import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { CatalogEmpty, CatalogError, CatalogLoading } from "../components/catalog/CatalogStates";
import ProductDiscovery from "../components/catalog/ProductDiscovery";
import ProductGrid from "../components/catalog/ProductGrid";
import { eligibleProducts, filterProducts, initialFilters, priceBounds, storageKey } from "../features/catalog/catalog";
import { useCatalog } from "../features/catalog/CatalogProvider";
import { usePreferences } from "../features/preferences/PreferenceProvider";

function readSaved(key, reset) { if (reset) return {}; try { return JSON.parse(sessionStorage.getItem(key)) || {}; } catch { return {}; } }

export default function ProductsPage() {
  const { products, status, retry, favorites } = useCatalog();
  const { petMode, language, t } = usePreferences();
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const featuredOnly = params.get("featured") === "1";
  const resetRequested = params.get("reset") === "1";
  const eligible = useMemo(() => eligibleProducts(products, petMode, featuredOnly), [products, petMode, featuredOnly]);
  const bounds = useMemo(() => priceBounds(eligible), [eligible]);
  const key = storageKey(petMode, featuredOnly);
  const contextToken = `${key}:${bounds.min}:${bounds.max}`;
  const [filterState, setFilterState] = useState(null);
  const filters = filterState?.token === contextToken ? filterState.values : null;

  useEffect(() => {
    if (!resetRequested) return;
    sessionStorage.removeItem(key);
    setFilterState(null);
    navigate({ pathname: location.pathname, hash: location.hash }, { replace: true });
  }, [resetRequested, key, navigate, location.pathname, location.hash]);
  useEffect(() => {
    if (status !== "success" || resetRequested) return;
    setFilterState({ token: contextToken, values: initialFilters(readSaved(key, false), petMode, bounds) });
  }, [status, resetRequested, contextToken, key, petMode, bounds]);
  useEffect(() => {
    if (status === "success" && !resetRequested && filters) sessionStorage.setItem(key, JSON.stringify(filters));
  }, [filters, key, status, resetRequested]);
  useEffect(() => { document.title = `${t("products")} — PAP`; }, [t, language]);
  const setFilters = (next) => setFilterState((current) => {
    const values = next === null ? initialFilters({}, petMode, bounds) : typeof next === "function" ? next(current.values) : next;
    return { token: contextToken, values };
  });
  const filtered = useMemo(() => filters ? filterProducts(eligible, filters, new Set(favorites), language) : [], [eligible, filters, favorites, language]);
  const emptyTitle = filters?.favoritesOnly ? t("noFavorites") : filters?.search.trim() ? t("noSearchResults") : t("noCategoryProducts");

  return <><section className="page-hero container"><span className="eyebrow">The good stuff</span><h1>{t("productsTitle")}</h1><p>{t("productsIntro")}</p></section>
    {status === "success" && filters && <ProductDiscovery bounds={bounds} filters={filters} setFilters={setFilters} count={filtered.length} />}
    <section className="container section catalog-results">{(status === "loading" || status === "success" && !filters) && <CatalogLoading />}{status === "error" && <CatalogError onRetry={retry} />}{status === "success" && filters && (filtered.length ? <ProductGrid products={filtered} /> : <CatalogEmpty title={emptyTitle} />)}</section>
  </>;
}
