import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { messages } from "./messages";
import { playCommerceSound } from "./sound";
import { readPreferences, writeValue } from "./storage";

const PreferenceContext = createContext(null);

export default function PreferenceProvider({ children }) {
  const [preferences, setPreferences] = useState(readPreferences);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = preferences.language;
    root.dataset.language = preferences.language;
    root.dataset.theme = preferences.theme;
    root.dataset.pet = preferences.petMode || "both";
    root.classList.remove("ui-booting");
    root.dataset.preferencesReady = "";
  }, [preferences]);

  const value = useMemo(() => {
    const update = (field, key, next) => {
      writeValue(localStorage, key, next);
      setPreferences((current) => ({ ...current, [field]: next }));
    };
    return {
      ...preferences,
      t(key, params = {}) {
        let text = messages[preferences.language][key] || key;
        Object.entries(params).forEach(([name, replacement]) => {
          text = text.replace(`{${name}}`, replacement);
        });
        return text;
      },
      setPetMode(mode) {
        writeValue(localStorage, "pap-mode", mode);
        try { sessionStorage.removeItem("pap-mode"); } catch { /* no-op */ }
        setPreferences((current) => ({ ...current, petMode: mode }));
      },
      toggleTheme() {
        update("theme", "pap-theme", preferences.theme === "dark" ? "light" : "dark");
      },
      toggleLanguage() {
        update("language", "pap-language", preferences.language === "th" ? "en" : "th");
      },
      toggleSound() {
        const next = preferences.sound === "on" ? "off" : "on";
        update("sound", "pap-sound", next);
        if (next === "on") playCommerceSound(true);
      },
      playSound(type) {
        return playCommerceSound(preferences.sound === "on", type);
      },
    };
  }, [preferences]);

  return <PreferenceContext.Provider value={value}>{children}</PreferenceContext.Provider>;
}

export function usePreferences() {
  const value = useContext(PreferenceContext);
  if (!value) throw new Error("usePreferences must be used inside PreferenceProvider");
  return value;
}
