import { useEffect } from "react";
import { usePreferences } from "../features/preferences/PreferenceProvider";

export default function PlaceholderPage({ page }) {
  const { t } = usePreferences();
  useEffect(() => { document.title = `${page} — pal2paw`; }, [page]);
  return (
    <section className="foundation-placeholder container" aria-label={`${page} placeholder`}>
      <p className="eyebrow">pal2paw</p>
      <h1>{page}</h1>
      <p>{t("foundation")}</p>
    </section>
  );
}
