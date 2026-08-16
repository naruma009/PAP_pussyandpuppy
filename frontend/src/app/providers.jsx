import PreferenceProvider from "../features/preferences/PreferenceProvider";
import CatalogProvider from "../features/catalog/CatalogProvider";
import CommerceProvider from "../features/commerce/CommerceProvider";

export default function AppProviders({ children }) {
  return <PreferenceProvider><CatalogProvider><CommerceProvider>{children}</CommerceProvider></CatalogProvider></PreferenceProvider>;
}
