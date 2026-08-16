import { Link } from "react-router-dom";
import { usePreferences } from "../features/preferences/PreferenceProvider";

export default function NotFoundPage() {
  const { t } = usePreferences();
  return (
    <main className="foundation-placeholder container">
      <h1>404</h1>
      <p>{t("notFound")}</p>
      <Link className="button" to="/home">{t("backHome")}</Link>
    </main>
  );
}
