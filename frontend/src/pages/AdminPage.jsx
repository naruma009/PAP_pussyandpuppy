import { useEffect } from "react";
import { usePreferences } from "../features/preferences/PreferenceProvider";
import AdminProducts from "../components/admin/AdminProducts";

export default function AdminPage() {
  const { language, t } = usePreferences();
  useEffect(() => { document.title = `${t("adminDashboard")} — PAP`; }, [language, t]);
  return <AdminProducts />;
}
