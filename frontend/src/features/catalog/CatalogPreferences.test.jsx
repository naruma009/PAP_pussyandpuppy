import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import PreferenceProvider, { usePreferences } from "../preferences/PreferenceProvider";

function Probe() {
  const { t } = usePreferences();
  return <span>{t("bothOnly")}|{t("forDog")}|{t("forBoth")}|{t("cartTitle")}|{t("logout")}</span>;
}

it.each(["cat", "dog", "both"].flatMap((mode) => ["light", "dark"].flatMap((theme) => ["th", "en"].map((language) => [mode, theme, language]))))(
  "hydrates %s mode with %s theme and %s catalog copy",
  (mode, theme, language) => {
    localStorage.setItem("pap-mode", mode);
    localStorage.setItem("pap-theme", theme);
    localStorage.setItem("pap-language", language);
    render(<PreferenceProvider><Probe /></PreferenceProvider>);
    expect(document.documentElement.dataset.pet).toBe(mode);
    expect(document.documentElement.dataset.theme).toBe(theme);
    expect(document.documentElement.lang).toBe(language);
    expect(screen.getByText(language === "en" ? "Cat & Dog|For Dog|For Cat & Dog|Cart of happiness|Logout" : "ใช้ได้ทั้งคู่|สำหรับหมา|สำหรับแมวและหมา|ตะกร้าความสุข|ออกจากระบบ")).toBeInTheDocument();
  },
);
