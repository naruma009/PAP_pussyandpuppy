import { usePreferences } from "../features/preferences/PreferenceProvider";

export default function PlaceholderPage({ page }) {
  const { t } = usePreferences();
  return (
    <section className="foundation-placeholder container" aria-label={`${page} placeholder`}>
      <p className="eyebrow">M3A Foundation</p>
      <h1>{page}</h1>
      <p>{t("foundation")}</p>
    </section>
  );
}
