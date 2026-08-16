export const VALID_MODES = ["cat", "dog", "both"];
export const VALID_THEMES = ["light", "dark"];
export const VALID_LANGUAGES = ["th", "en"];
export const VALID_SOUND = ["on", "off"];

export function readValue(storage, key, allowed, fallback) {
  try {
    const value = storage.getItem(key);
    return allowed.includes(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

export function readPreferences(local = localStorage, session = sessionStorage) {
  const bootstrap = globalThis.window?.__PAP_PREFERENCES__ || {};
  const storedMode = readValue(local, "pap-mode", VALID_MODES, "");
  return {
    language: readValue(local, "pap-language", VALID_LANGUAGES, bootstrap.language || "th"),
    theme: readValue(local, "pap-theme", VALID_THEMES, bootstrap.theme || "light"),
    petMode: storedMode || readValue(session, "pap-mode", VALID_MODES, ""),
    sound: readValue(local, "pap-sound", VALID_SOUND, "off"),
  };
}

export function writeValue(storage, key, value) {
  try {
    storage.setItem(key, value);
  } catch {
    // Keep the in-memory preference usable when browser storage is unavailable.
  }
}
