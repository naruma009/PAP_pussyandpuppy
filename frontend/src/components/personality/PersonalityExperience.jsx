import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { usePreferences } from "../../features/preferences/PreferenceProvider";
import { mascotKindsForMode, supportsMascotRoute } from "../../features/personality/mascotBehavior";
import { createMascotController } from "../../features/personality/mascotController";
import Mascot from "./Mascot";
import PetInteractions from "./PetInteractions";
import PetChat from "./PetChat";
const mediaMatches = (query) => typeof matchMedia === "function" && matchMedia(query).matches;

export default function PersonalityExperience() {
  const { pathname } = useLocation(); const { language, petMode } = usePreferences(); const refs = useRef([]), controllersRef = useRef([]); const [menuKind, setMenuKind] = useState(null);
  const enabled = supportsMascotRoute(pathname); const kinds = enabled ? mascotKindsForMode(petMode) : [];
  const getControllers = useCallback(() => controllersRef.current, []);
  const closeMenu = useCallback(() => setMenuKind(null), []);
  useEffect(() => { setMenuKind(null); }, [pathname, petMode]);
  useEffect(() => {
    if (!enabled) return undefined;
    const reducedMotion = mediaMatches("(prefers-reduced-motion: reduce)");
    const controllers = kinds.map((kind, index) => createMascotController({ element:refs.current[index], kind, index, mobile:mediaMatches("(max-width: 700px)"), onDraw(model) { const element = refs.current[index]; if (!element) return; element.dataset.state = model.state; element.dataset.direction = model.direction; element.style.setProperty("--mascot-x", `${Math.round(model.x)}px`); element.style.setProperty("--mascot-y", `${Math.round(-model.y)}px`); element.style.setProperty("--mascot-duration", `${model.duration}ms`); element.style.setProperty("--look-x", String(model.lookX)); element.style.setProperty("--look-y", String(model.lookY)); } }));
    controllers.forEach((controller) => controller.setPeers(controllers));
    controllersRef.current = controllers;
    if (reducedMotion) return () => { controllersRef.current = []; controllers.forEach((controller) => controller.destroy()); };
    controllers.forEach((controller) => controller.start());
    let pointerFrame = 0, scrollFrame = 0, destroyed = false;
    const onPointerMove = (event) => { if (destroyed || pointerFrame) return; pointerFrame = requestAnimationFrame(() => { pointerFrame = 0; if (!destroyed) controllers.forEach((controller) => controller.look(event.clientX, event.clientY)); }); };
    const onScroll = () => { if (destroyed || scrollFrame) return; scrollFrame = requestAnimationFrame(() => { scrollFrame = 0; if (!destroyed) controllers.forEach((controller) => controller.syncWithTarget()); }); };
    const observer = new MutationObserver(onScroll); observer.observe(document.querySelector("main") || document.body, { childList:true, subtree:true });
    addEventListener("pointermove", onPointerMove, { passive:true }); addEventListener("scroll", onScroll, { passive:true });
    const destroy = () => { if (destroyed) return; destroyed = true; controllersRef.current = []; removeEventListener("pointermove", onPointerMove); removeEventListener("scroll", onScroll); removeEventListener("pagehide", destroy); if (pointerFrame) cancelAnimationFrame(pointerFrame); if (scrollFrame) cancelAnimationFrame(scrollFrame); observer.disconnect(); controllers.forEach((controller) => controller.destroy()); };
    addEventListener("pagehide", destroy, { once:true }); return destroy;
  }, [enabled, petMode, pathname]);
  if (!enabled) return null;
  const activate = (kind) => { const controller = controllersRef.current.find((item) => item.kind === kind); if (!controller?.isLocked()) setMenuKind(kind); };
  return <><div className="pap-mascot-stage" data-testid="mascot-stage">{kinds.map((kind, index) => <Mascot key={kind} kind={kind} language={language} onActivate={activate} ref={(node) => { refs.current[index] = node; }} />)}</div><PetInteractions key={`actions-${pathname}-${petMode}`} getControllers={getControllers} menuKind={menuKind} onCloseMenu={closeMenu} /><PetChat key={`chat-${pathname}-${petMode}`} getControllers={getControllers} mode={petMode} /></>;
}
