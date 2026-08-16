import { money } from "../../features/catalog/catalog";
import { usePreferences } from "../../features/preferences/PreferenceProvider";

export default function ProductPreview({ values, image }) {
  const { language, t } = usePreferences();
  const name = values.name.trim() || t("previewProductName");
  const description = values.description.trim() || t("previewProductDescription");
  const stock = Math.max(0, Number(values.stock) || 0);
  return <aside className="admin-preview"><span className="eyebrow">{t("livePreview")}</span><div className="preview-image">{image ? <img src={image} alt={name} /> : <span className="admin-emoji" aria-hidden="true">{values.emoji || "🐾"}</span>}</div><small>{values.category} · {t(`adminPet.${values.petType}`)}</small><h3>{name}</h3><p>{description}</p><strong>{money(Number(values.price) || 0, language)}</strong><div className={`stock${stock === 0 ? " out" : ""}`}>{stock === 0 ? t("outStock") : t("adminStockCount", { count: stock })}</div></aside>;
}
