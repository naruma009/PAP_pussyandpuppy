import PreferenceProvider from "../features/preferences/PreferenceProvider";

export default function AppProviders({ children }) {
  return <PreferenceProvider>{children}</PreferenceProvider>;
}
