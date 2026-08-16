import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { usePreferences } from "../../features/preferences/PreferenceProvider";
import { mascotKindsForMode, supportsMascotRoute } from "../../features/personality/mascotBehavior";
import { createMascotController } from "../../features/personality/mascotController";
import Mascot from "./Mascot";
const mediaMatches = (query) => typeof matchMedia === "function" && matchMedia(query).matches;

export default function PersonalityExperience() {
  const { pathname } = useLocation(); const { language, petMode } = usePreferences(); const refs = useRef([]);
  const enabled = supportsMascotRoute(pathname); const kinds = enabled ? mascotKindsForMode(petMode) : [];
  useEffect(() => {
    if (!enabled || mediaMatches("(prefers-reduced-motion: reduce)")) return undefined;
    const controllers = kinds.map((kind, index) => createMascotController({ element:refs.current[index], kind, index, mobile:mediaMatches("(max-width: 700px)"), onDraw(model) { const element = refs.current[index]; if (!element) return; element.dataset.state = model.state; element.dataset.direction = model.direction; element.style.setProperty("--mascot-x", `${Math.round(model.x)}px`); element.style.setProperty("--mascot-y", `${Math.round(-model.y)}px`); element.style.setProperty("--mascot-duration", `${model.duration}ms`); element.style.setProperty("--look-x", String(model.lookX)); element.style.setProperty("--look-y", String(model.lookY)); } }));
    controllers.forEach((controller) => controller.setPeers(controllers));
    controllers.forEach((controller) => controller.start());
    let pointerFrame = 0, scrollFrame = 0, destroyed = false;
    const onPointerMove = (event) => { if (destroyed || pointerFrame) return; pointerFrame = requestAnimationFrame(() => { pointerFrame = 0; if (!destroyed) controllers.forEach((controller) => controller.look(event.clientX, event.clientY)); }); };
    const onScroll = () => { if (destroyed || scrollFrame) return; scrollFrame = requestAnimationFrame(() => { scrollFrame = 0; if (!destroyed) controllers.forEach((controller) => controller.syncWithTarget()); }); };
    const observer = new MutationObserver(onScroll); observer.observe(document.querySelector("main") || document.body, { childList:true, subtree:true });
    addEventListener("pointermove", onPointerMove, { passive:true }); addEventListener("scroll", onScroll, { passive:true });
    const destroy = () => { if (destroyed) return; destroyed = true; removeEventListener("pointermove", onPointerMove); removeEventListener("scroll", onScroll); removeEventListener("pagehide", destroy); if (pointerFrame) cancelAnimationFrame(pointerFrame); if (scrollFrame) cancelAnimationFrame(scrollFrame); observer.disconnect(); controllers.forEach((controller) => controller.destroy()); };
    addEventListener("pagehide", destroy, { once:true }); return destroy;
  }, [enabled, petMode, pathname]);
  if (!enabled) return null;
  return <div className="pap-mascot-stage" data-testid="mascot-stage">{kinds.map((kind, index) => <Mascot key={kind} kind={kind} language={language} ref={(node) => { refs.current[index] = node; }} />)}</div>;
}
