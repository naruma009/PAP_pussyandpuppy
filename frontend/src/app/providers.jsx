import PreferenceProvider from "../features/preferences/PreferenceProvider";
import CatalogProvider from "../features/catalog/CatalogProvider";

export default function AppProviders({ children }) {
  return <PreferenceProvider><CatalogProvider>{children}</CatalogProvider></PreferenceProvider>;
}
