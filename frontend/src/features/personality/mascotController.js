import { IDLE_STATES, isPerchableRect, randomItem, randomWait } from "./mascotBehavior";

export function createMascotController({ element, kind, index, mobile, random = Math.random, onDraw }) {
  const model = { state:"idle", direction:index ? "left" : "right", x:index ? innerWidth - 120 : 28, y:10 + index * 6, duration:0, lookX:0, lookY:0 };
  let timer = 0, targetCard = null, perchRatio = index ? .72 : .25, perchSteps = 0, destroyed = false, running = false, peers = [], lockOwner = null, interactionSnapshot = null;
  const draw = () => { if (!destroyed) onDraw(model); };
  const schedule = (callback, delay) => { clearTimeout(timer); timer = window.setTimeout(callback, delay); };
  const groundY = () => 10 + index * 6;
  const visibleCards = () => [...document.querySelectorAll(".product-card")].filter((card) => isPerchableRect(card.getBoundingClientRect(), innerHeight));
  const cardRect = () => { if (!targetCard?.isConnected) return null; const rect = targetCard.getBoundingClientRect(); return isPerchableRect(rect, innerHeight) ? rect : null; };
  const perchPoint = (rect) => { let x = rect.left + 8 + Math.max(1, rect.width - 72) * perchRatio; const peer = peers.find((item) => item.targetCard() === targetCard && Math.abs(item.x() - x) < 78); if (peer) x += x < rect.left + rect.width / 2 ? 82 : -82; return { x:Math.max(8, Math.min(innerWidth - 76, x)), y:Math.max(groundY(), innerHeight - rect.top - 2) }; };
  const walk = () => { if (destroyed) return; targetCard = null; const leave = !mobile && random() < .13; const target = leave ? (random() < .5 ? -90 : innerWidth + 20) : 18 + random() * Math.max(1, innerWidth - 110); const distance = Math.abs(target - model.x); Object.assign(model, { direction:target < model.x ? "left" : "right", state:"ground-walk", duration:Math.max(1100, Math.min(5200, distance * (mobile ? 10 : 7))), x:target, y:groundY() }); draw(); schedule(next, model.duration + randomWait(350, 900, random)); };
  const rest = () => { if (destroyed) return; targetCard = null; Object.assign(model, { state:randomItem(IDLE_STATES, random), duration:240, y:groundY() }); draw(); schedule(next, randomWait(mobile ? 2600 : 1700, mobile ? 3000 : 2800, random)); };
  const jumpDown = (immediate = false) => { targetCard = null; perchSteps = 0; Object.assign(model, { state:"jump-down", duration:immediate ? 260 : 620, y:groundY() }); draw(); schedule(walk, model.duration + 180); };
  const perch = () => { const rect = cardRect(); if (!rect) { jumpDown(true); return; } perchSteps += 1; if (perchSteps > (kind === "cat" ? 3 : 2) || random() < .22) { jumpDown(); return; } const state = randomItem(kind === "cat" ? ["perch","card-walk","sit","sleep","curious"] : ["perch","sit","happy","curious"], random); if (state === "card-walk") perchRatio = Math.max(.12, Math.min(.82, perchRatio + (random() < .5 ? -.18 : .18))); Object.assign(model, { state, duration:state === "card-walk" ? 850 : 220, ...perchPoint(rect) }); draw(); schedule(perch, randomWait(1500, 1800, random)); };
  const jumpUp = () => { const rect = cardRect(); if (!rect) { targetCard = null; rest(); return; } const point = perchPoint(rect); Object.assign(model, { direction:point.x < model.x ? "left" : "right", state:"jump-up", duration:kind === "cat" ? 620 : 760, ...point }); draw(); schedule(perch, model.duration + 120); };
  const approachCard = (cards) => { const freeCards = cards.filter((card) => !peers.some((peer) => peer.targetCard() === card)); targetCard = randomItem(freeCards.length ? freeCards : cards, random); perchRatio = kind === "cat" ? .18 + random() * .64 : .28 + random() * .44; perchSteps = 0; const rect = targetCard.getBoundingClientRect(); const target = Math.max(12, Math.min(innerWidth - 82, rect.left + (model.x < rect.left ? -34 : rect.width + 10))); const distance = Math.abs(target - model.x); Object.assign(model, { direction:target < model.x ? "left" : "right", state:"approach-card", duration:Math.max(700, Math.min(3000, distance * 6)), x:target, y:groundY() }); draw(); schedule(jumpUp, model.duration + 180); };
  function next() { if (destroyed) return; const cards = visibleCards(); if (!mobile && cards.length && random() < (kind === "cat" ? .46 : .2)) approachCard(cards); else if (random() < (mobile ? .38 : .58)) walk(); else rest(); }
  const api = {
    kind,
    element,
    setPeers(nextPeers) { peers = nextPeers.filter((peer) => peer !== api); },
    targetCard:() => targetCard,
    x:() => model.x,
    start() { if (destroyed || running) return; running = true; schedule(next, randomWait(900, 1400, random)); },
    isLocked() { return Boolean(lockOwner); },
    beginInteraction(owner) { if (destroyed || lockOwner) return false; lockOwner = owner; interactionSnapshot = { state:model.state, targetCard }; clearTimeout(timer); model.duration = 0; draw(); return true; },
    showInteractionState(owner, state) { if (destroyed || lockOwner !== owner) return false; model.state = state; model.duration = 180; draw(); return true; },
    endInteraction(owner) { if (destroyed || lockOwner !== owner) return false; const snapshot = interactionSnapshot; interactionSnapshot = null; lockOwner = null; if (!running) { model.state = snapshot?.state || "idle"; model.duration = 0; draw(); } else if (snapshot?.targetCard?.isConnected) { targetCard = snapshot.targetCard; perch(); } else if (IDLE_STATES.includes(snapshot?.state)) { model.state = snapshot.state; model.duration = 180; draw(); schedule(next, randomWait(900, 1400, random)); } else walk(); return true; },
    pauseForResponse() { return api.beginInteraction("chat"); },
    reactAndResume() { if (!api.showInteractionState("chat", random() < .7 ? "happy" : "curious")) return false; schedule(() => api.endInteraction("chat"), 1300); return true; },
    look(clientX, clientY) { if (mobile || destroyed) return; const rect = element.getBoundingClientRect(); model.lookX = Math.max(-1, Math.min(1, (clientX - (rect.left + rect.width / 2)) / 220)).toFixed(2); model.lookY = Math.max(-1, Math.min(1, (clientY - (rect.top + rect.height / 2)) / 180)).toFixed(2); draw(); },
    syncWithTarget() { if (!targetCard || destroyed) return; const rect = cardRect(); if (!rect) { jumpDown(true); return; } Object.assign(model, { ...perchPoint(rect), duration:90 }); draw(); },
    destroy() { destroyed = true; clearTimeout(timer); targetCard = null; lockOwner = null; interactionSnapshot = null; },
  };
  return api;
}
