import { useEffect, useRef, useState } from "react";
import { ACTION_REPLIES } from "../../features/personality/personalityData";
import { randomBetween } from "../../features/personality/personalityBehavior";
import { randomItem } from "../../features/personality/mascotBehavior";
import { usePreferences } from "../../features/preferences/PreferenceProvider";

export default function PetInteractions({ getControllers, menuKind, onCloseMenu, random = Math.random }) {
  const { language, playSound, t } = usePreferences();
  const [bubbles, setBubbles] = useState({});
  const menuRef = useRef(null);
  const timersRef = useRef(new Map());
  const controller = getControllers().find((item) => item.kind === menuKind);

  useEffect(() => { if (menuKind) menuRef.current?.querySelector("button")?.focus(); }, [menuKind]);
  useEffect(() => {
    if (!menuKind) return undefined;
    const close = (event) => {
      if (event.type === "keydown" && event.key !== "Escape") return;
      if (event.type === "pointerdown" && (menuRef.current?.contains(event.target) || event.target.closest?.(".pap-mascot"))) return;
      onCloseMenu();
      if (event.type === "keydown") controller?.element.focus();
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", close); };
  }, [controller, menuKind, onCloseMenu]);
  useEffect(() => () => {
    timersRef.current.forEach(({ timer, controller: active, owner }) => { clearTimeout(timer); active.endInteraction(owner); });
    timersRef.current.clear();
  }, []);

  const perform = (action) => {
    const active = getControllers().find((item) => item.kind === menuKind);
    onCloseMenu();
    if (!active) return;
    const owner = `direct-${action}`;
    if (!active.beginInteraction(owner)) return;
    active.showInteractionState(owner, action === "feed" ? "excited" : "relaxed");
    const rect = active.element.getBoundingClientRect();
    const bubble = { owner, text:randomItem(ACTION_REPLIES[language][action][active.kind], random), left:Math.max(8, Math.min(innerWidth - 180, rect.left - 40)), top:Math.max(70, rect.top - 52) };
    setBubbles((current) => ({ ...current, [active.kind]:bubble }));
    playSound(action, active.kind);
    const timer = window.setTimeout(() => {
      if (timersRef.current.get(active.kind)?.owner !== owner) return;
      timersRef.current.delete(active.kind);
      setBubbles((current) => { const next = { ...current }; delete next[active.kind]; return next; });
      active.endInteraction(owner);
    }, randomBetween(1500, 3000, random));
    timersRef.current.set(active.kind, { timer, controller:active, owner });
  };

  return <div className="pap-personality">
    {menuKind && controller && <div ref={menuRef} className="pap-action-menu" style={{ left:Math.max(8, Math.min(innerWidth - 190, controller.element.getBoundingClientRect().left - 45)), top:Math.max(70, Math.min(innerHeight - 110, controller.element.getBoundingClientRect().top - 76)) }}>
      <button type="button" onClick={() => perform("feed")}>{t("personalityFeed")}</button>
      <button type="button" onClick={() => perform("pet")}>{t("personalityPet")}</button>
    </div>}
    {Object.entries(bubbles).map(([kind, bubble]) => <div key={kind} className={`pap-action-bubble pap-action-bubble--${kind}`} role="status" style={{ left:bubble.left, top:bubble.top }}>{bubble.text}</div>)}
  </div>;
}
