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
  const selectMode = (mode) => {
    setPetMode(mode);
    playSound("click");
    navigate("/home");
  };
  return (
    <div className="pet-selection-page">
      <PreferenceControls compact />
      <main className="landing">
        <div className="brand"><span>P</span>PAP — Pussy and Puppy</div>
        <h1>{t("landingTitle")}</h1>
        <p className="landing-intro">{t("landingIntro")}</p>
        <div className="pet-choices">
          {choices.map((choice) => (
            <button key={choice.mode} className={`pet-choice ${choice.mode}`} type="button" onClick={() => selectMode(choice.mode)}>
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
