import { categoriesForMode, money, petTypesForMode } from "../../features/catalog/catalog";
import { usePreferences } from "../../features/preferences/PreferenceProvider";

export default function ProductDiscovery({ bounds, filters, setFilters, count }) {
  const { petMode, language, t } = usePreferences();
  const span = Math.max(1, bounds.max - bounds.min);
  const style = { "--range-left": `${((filters.min - bounds.min) / span) * 100}%`, "--range-right": `${100 - ((filters.max - bounds.min) / span) * 100}%` };
  const update = (patch) => setFilters((current) => ({ ...current, ...patch }));
  const young = petMode === "cat" ? t("kitten") : petMode === "dog" ? t("puppy") : t("puppyKitten");
  return <div className="filters" style={style}>
    <div className="category-chips" role="group" aria-label={t("productFilters")}>{["all", ...categoriesForMode(petMode)].map((category) => <button className={`filter-button${filters.category === category ? " active" : ""}`} type="button" key={category} aria-pressed={filters.category === category} onClick={() => update({ category })}>{category === "all" ? t("allProducts") : t(`category.${category}`)}</button>)}</div>
    <div className="filter-tools">
      <label className="age-filter discovery-search">{t("search")}<span><input type="search" value={filters.search} placeholder={t("searchPlaceholder")} onChange={(event) => update({ search: event.target.value })} /><button type="button" hidden={!filters.search} aria-label={t("clearSearch")} onClick={() => update({ search: "" })}>×</button></span></label>
      <label className="age-filter pet-type-filter">{t("petType")}<select value={filters.petType} onChange={(event) => update({ petType: event.target.value })}>{petTypesForMode(petMode).map((type) => <option key={type} value={type}>{t(type === "cat" ? "catOnly" : type === "dog" ? "dogOnly" : "bothOnly")}</option>)}</select></label>
      <label className="age-filter product-age-filter">{t("age")}<select value={filters.age} onChange={(event) => update({ age: event.target.value })}><option value="all">{t("allAges")}</option><option value="young">{young}</option><option value="adult">{t("adult")}</option><option value="senior">{t("senior")}</option></select></label>
      <label className="stock-toggle"><input type="checkbox" checked={filters.hideOutOfStock} onChange={(event) => update({ hideOutOfStock: event.target.checked })} /><span aria-hidden="true" /><strong>{t("hideOutOfStock")}</strong></label>
      <label className="age-filter sort-filter">{t("sort")}<select value={filters.sort} onChange={(event) => update({ sort: event.target.value })}><option value="default">{t("recommended")}</option><option value="price-asc">{t("priceLowHigh")}</option><option value="price-desc">{t("priceHighLow")}</option><option value="name">{t("nameAZ")}</option><option value="newest">{t("newest")}</option></select></label>
      <div className="price-filter"><div><span>{t("priceRange")}</span><strong>{money(filters.min, language)} — {money(filters.max, language)}</strong></div><div className="dual-range"><div className="range-track" /><input aria-label={t("minimumPrice")} type="range" min={bounds.min} max={bounds.max} value={filters.min} onChange={(event) => update({ min: Math.min(Number(event.target.value), filters.max) })} /><input aria-label={t("maximumPrice")} type="range" min={bounds.min} max={bounds.max} value={filters.max} onChange={(event) => update({ max: Math.max(Number(event.target.value), filters.min) })} /></div></div>
      <div className="favorite-filter-wrap"><button className="favorite-filter" type="button" aria-pressed={filters.favoritesOnly} onClick={() => update({ favoritesOnly: !filters.favoritesOnly })}>♥ {t("favoritesOnly")}</button><small>{t("favoritesDeviceOnly")}</small></div>
      <button className="reset-filters" type="button" onClick={() => setFilters(null)}>{t("resetFilters")}</button>
    </div><p className="discovery-status" aria-live="polite">{t(filters.search.trim() ? "searchCount" : "productCount", { count })}</p>
  </div>;
}
