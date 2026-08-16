import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PreferenceControls from "../components/layout/PreferenceControls";
import { usePreferences } from "../features/preferences/PreferenceProvider";

const choices = [
  { mode: "cat", icon: "🐱", title: "Cat", copy: "catCopy" },
  { mode: "dog", icon: "🐶", title: "Dog", copy: "dogCopy" },
  { mode: "both", icon: "🐱 🐶", title: "Both", copy: "bothCopy" },
];

export default function PetSelectionPage() {
  const navigate = useNavigate();
  const { playSound, setPetMode, t } = usePreferences();
  const timerRef = useRef(0);
  const [chosen, setChosen] = useState("");
  useEffect(() => { document.title = "PAP — Pussy and Puppy"; }, []);
  useEffect(() => () => clearTimeout(timerRef.current), []);
  const selectMode = (mode) => {
    if (timerRef.current) return;
    setPetMode(mode);
    playSound("click");
    setChosen(mode);
    timerRef.current = window.setTimeout(() => navigate("/home"), 850);
  };
  return (
    <div className={`pet-selection-page${chosen ? " leaving" : ""}`}>
      <PreferenceControls compact />
      <main className="landing">
        <div className="brand"><span>P</span>PAP — Pussy and Puppy</div>
        <h1>{t("landingTitle")}</h1>
        <p className="landing-intro">{t("landingIntro")}</p>
        <div className="pet-choices">
          {choices.map((choice) => (
            <button key={choice.mode} className={`pet-choice ${choice.mode}${chosen === choice.mode ? " chosen" : ""}`} type="button" disabled={Boolean(chosen)} onClick={() => selectMode(choice.mode)}>
              <span className="pet-pop" aria-hidden="true"><span className="pet">{choice.icon}</span></span>
              <h2>{choice.title}</h2>
              <p>{t(choice.copy)}</p>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
