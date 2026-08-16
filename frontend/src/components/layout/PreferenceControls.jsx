import { usePreferences } from "../../features/preferences/PreferenceProvider";

export default function PreferenceControls({ compact = false }) {
  const { language, sound, theme, t, toggleLanguage, toggleSound, toggleTheme } = usePreferences();
  return (
    <div className={compact ? "landing-preferences" : "preference-controls"}>
      <button className="language-toggle" type="button" onClick={toggleLanguage} aria-label={language === "th" ? "Switch to English" : "เปลี่ยนเป็นภาษาไทย"}>
        {language === "th" ? "EN" : "TH"}
      </button>
      <button className="sound-toggle" type="button" onClick={toggleSound} aria-label={t(sound === "on" ? "soundOn" : "soundOff")}>
        {sound === "on" ? "🔊" : "🔇"}
      </button>
      <button className="theme-switch" type="button" onClick={toggleTheme} aria-label={t(theme === "dark" ? "light" : "dark")}>
        {theme === "dark" ? "☀" : "☾"}
      </button>
    </div>
  );
}
