import { useEffect } from "react";
import { usePreferences } from "../features/preferences/PreferenceProvider";

export default function AdminPage() {
  const { language, t } = usePreferences();
  useEffect(() => { document.title = `${t("adminDashboard")} — PAP`; }, [language, t]);
  return <section className="admin-foundation container"><span className="eyebrow">PAP Admin</span><h1>{t("adminDashboard")}</h1><p>{t("adminFoundation")}</p></section>;
}
