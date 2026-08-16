import { createMascotVisual, renderMascot, setMascotVisible } from "./pet-mascot-visuals.js";

const CAT_REPLIES = ["เหมียว", "เหมียววว~", "เมี๊ยว?", "เหมียว!", "เมี๊ยววว", "...เหมียว"];
const DOG_REPLIES = ["โฮ่ง!", "โฮ่งโฮ่ง!", "บ๊อก!", "บ๊อกบ๊อก", "โฮ่งงง", "แฮ่ก ๆ... โฮ่ง!"];
const IDLE_STATES = ["idle", "sit", "sleep", "curious"];

const randomItem = (items) => items[Math.floor(Math.random() * items.length)];
const wait = (minimum, spread) => minimum + Math.floor(Math.random() * spread);
export const mascotKindsForMode = (mode) => mode === "both" ? ["cat", "dog"] : [mode];
export const chatResponderForMode = (mode) => mode === "both" ? randomItem(["cat", "dog"]) : mode;
export const isPerchableRect = (rect, viewportHeight) => rect.width > 100 && rect.top > 82 && rect.top < viewportHeight - 105 && rect.bottom > 120;

class MascotController {
  constructor(kind, stage, index, reducedMotion, mobile) {
    this.kind = kind;
    this.index = index;
    this.visual = createMascotVisual(kind);
    this.model = { state:"idle", direction:index ? "left" : "right", x:index ? innerWidth - 120 : 28, y:10 + index * 6, duration:0, lookX:0, lookY:0 };
    this.reducedMotion = reducedMotion;
    this.mobile = mobile;
    this.timer = 0;
    this.paused = false;
    this.targetCard = null;
    this.perchRatio = index ? .72 : .25;
    this.perchSteps = 0;
    this.peers = [];
    this.chatSnapshot = null;
    this.destroyed = false;
    stage.append(this.visual.root);
    this.draw();
  }

  draw() { renderMascot(this.visual, this.model); }
  setPeers(peers) { this.peers = peers.filter((peer) => peer !== this); }
  groundY() { return 10 + this.index * 6; }

  visibleCards() {
    return [...document.querySelectorAll(".product-card")].filter((card) => {
      const rect = card.getBoundingClientRect();
      return isPerchableRect(rect, innerHeight);
    });
  }

  cardRect() {
    if (!this.targetCard?.isConnected) return null;
    const rect = this.targetCard.getBoundingClientRect();
    return isPerchableRect(rect, innerHeight) ? rect : null;
  }

  perchPoint(rect) {
    const width = Math.max(1, rect.width - 72);
    let x = rect.left + 8 + width * this.perchRatio;
    const peer = this.peers.find((item) => item.targetCard === this.targetCard && Math.abs(item.model.x - x) < 78);
    if (peer) x += x < rect.left + rect.width / 2 ? 82 : -82;
    return { x:Math.max(8, Math.min(innerWidth - 76, x)), y:Math.max(this.groundY(), innerHeight - rect.top - 2) };
  }

  start() {
    if (this.reducedMotion) { setMascotVisible(this.visual, false); return; }
    this.schedule(wait(900, 1400));
  }

  schedule(delay) {
    clearTimeout(this.timer);
    this.timer = window.setTimeout(() => this.next(), delay);
  }

  next() {
    if (this.paused) return;
    const cards = this.visibleCards();
    const climbChance = this.kind === "cat" ? .46 : .2;
    if (!this.mobile && cards.length && Math.random() < climbChance) this.approachCard(cards);
    else if (Math.random() < (this.mobile ? .38 : .58)) this.walk();
    else this.rest();
  }

  approachCard(cards) {
    const freeCards = cards.filter((card) => !this.peers.some((peer) => peer.targetCard === card));
    this.targetCard = randomItem(freeCards.length ? freeCards : cards);
    this.perchRatio = this.kind === "cat" ? .18 + Math.random() * .64 : .28 + Math.random() * .44;
    this.perchSteps = 0;
    const rect = this.targetCard.getBoundingClientRect();
    const target = Math.max(12, Math.min(innerWidth - 82, rect.left + (this.model.x < rect.left ? -34 : rect.width + 10)));
    const distance = Math.abs(target - this.model.x);
    this.model.direction = target < this.model.x ? "left" : "right";
    this.model.state = "approach-card";
    this.model.duration = Math.max(700, Math.min(3000, distance * 6));
    this.model.x = target;
    this.model.y = this.groundY();
    this.draw();
    clearTimeout(this.timer);
    this.timer = window.setTimeout(() => this.jumpUp(), this.model.duration + 180);
  }

  jumpUp() {
    const rect = this.cardRect();
    if (!rect) { this.targetCard = null; this.rest(); return; }
    const point = this.perchPoint(rect);
    this.model.direction = point.x < this.model.x ? "left" : "right";
    this.model.state = "jump-up";
    this.model.duration = this.kind === "cat" ? 620 : 760;
    this.model.x = point.x;
    this.model.y = point.y;
    this.draw();
    clearTimeout(this.timer);
    this.timer = window.setTimeout(() => this.perch(), this.model.duration + 120);
  }

  perch() {
    const rect = this.cardRect();
    if (!rect) { this.jumpDown(true); return; }
    this.perchSteps++;
    if (this.perchSteps > (this.kind === "cat" ? 3 : 2) || Math.random() < .22) { this.jumpDown(); return; }
    const states = this.kind === "cat" ? ["perch", "card-walk", "sit", "sleep", "curious"] : ["perch", "sit", "happy", "curious"];
    this.model.state = randomItem(states);
    if (this.model.state === "card-walk") {
      const nextRatio = Math.max(.12, Math.min(.82, this.perchRatio + (Math.random() < .5 ? -.18 : .18)));
      this.model.direction = nextRatio < this.perchRatio ? "left" : "right";
      this.perchRatio = nextRatio;
    }
    const point = this.perchPoint(rect);
    this.model.x = point.x;
    this.model.y = point.y;
    this.model.duration = this.model.state === "card-walk" ? 850 : 220;
    this.draw();
    clearTimeout(this.timer);
    this.timer = window.setTimeout(() => this.perch(), wait(1500, 1800));
  }

  jumpDown(immediate = false) {
    clearTimeout(this.timer);
    this.targetCard = null;
    this.perchSteps = 0;
    this.model.state = "jump-down";
    this.model.duration = immediate ? 260 : 620;
    this.model.y = this.groundY();
    this.draw();
    this.timer = window.setTimeout(() => this.walk(), this.model.duration + 180);
  }

  syncWithTarget() {
    if (!this.targetCard || this.paused) return;
    const rect = this.cardRect();
    if (!rect) { this.jumpDown(true); return; }
    const point = this.perchPoint(rect);
    this.model.x = point.x;
    this.model.y = point.y;
    this.model.duration = 90;
    this.draw();
  }

  walk() {
    const margin = 18;
    const leave = !this.mobile && Math.random() < .13;
    let target = leave ? (Math.random() < .5 ? -90 : innerWidth + 20) : margin + Math.random() * Math.max(1, innerWidth - 110);
    const distance = Math.abs(target - this.model.x);
    this.model.direction = target < this.model.x ? "left" : "right";
    this.model.state = "ground-walk";
    this.model.duration = Math.max(1100, Math.min(5200, distance * (this.mobile ? 10 : 7)));
    this.model.x = target;
    this.model.y = this.groundY();
    this.draw();
    this.schedule(this.model.duration + wait(350, 900));
  }

  rest() {
    this.targetCard = null;
    this.model.state = randomItem(IDLE_STATES);
    this.model.duration = 240;
    this.model.y = this.groundY();
    this.draw();
    this.schedule(wait(this.mobile ? 2600 : 1700, this.mobile ? 3000 : 2800));
  }

  look(clientX, clientY) {
    if (this.mobile || this.paused) return;
    const rect = this.visual.root.getBoundingClientRect();
    this.model.lookX = Math.max(-1, Math.min(1, (clientX - (rect.left + rect.width / 2)) / 220)).toFixed(2);
    this.model.lookY = Math.max(-1, Math.min(1, (clientY - (rect.top + rect.height / 2)) / 180)).toFixed(2);
    this.draw();
  }

  pauseForResponse() {
    if (this.destroyed) return;
    this.chatSnapshot = { state:this.model.state, targetCard:this.targetCard };
    this.paused = true;
    clearTimeout(this.timer);
    this.model.duration = 0;
    this.draw();
  }

  reactAndResume() {
    if (this.destroyed) return;
    this.model.state = Math.random() < .7 ? "happy" : "curious";
    this.model.duration = 180;
    this.draw();
    this.timer = window.setTimeout(() => {
      if (this.destroyed) return;
      const snapshot = this.chatSnapshot;
      this.chatSnapshot = null;
      this.paused = false;
      if (snapshot?.targetCard && snapshot.targetCard.isConnected) { this.targetCard = snapshot.targetCard; this.perch(); }
      else if (["idle", "sit", "sleep", "curious"].includes(snapshot?.state)) { this.model.state = snapshot.state; this.model.duration = 180; this.draw(); this.schedule(wait(900, 1400)); }
      else this.walk();
    }, 1300);
  }

  destroy() { this.destroyed = true; clearTimeout(this.timer); this.visual.root.remove(); }
}

function createChat(mode, controllers) {
  const shell = document.createElement("div");
  shell.className = "pap-pet-chat";
  shell.innerHTML = `<button class="pap-chat-launcher" type="button" aria-expanded="false">🐾 <span>ถามน้อง PAP</span></button><section class="pap-chat-panel" hidden aria-label="PAP Pet Chat"><header><div><strong>PAP Pet Chat</strong><small>พวกน้องตอบตามภาษาของพวกน้อง — ไม่ใช่ AI</small></div><button class="pap-chat-close" type="button" aria-label="ปิด">×</button></header><div class="pap-chat-messages" aria-live="polite"></div><form><label class="sr-only" for="pap-chat-input">ข้อความถึงน้อง</label><input id="pap-chat-input" maxlength="180" autocomplete="off" placeholder="อยากรู้อะไร ถามน้องได้เลย"><button type="submit">ส่ง</button></form></section>`;
  document.body.append(shell);
  const launcher = shell.querySelector(".pap-chat-launcher");
  const panel = shell.querySelector(".pap-chat-panel");
  const close = shell.querySelector(".pap-chat-close");
  const form = shell.querySelector("form");
  const input = shell.querySelector("input");
  const messages = shell.querySelector(".pap-chat-messages");
  let pending = false;
  let responseTimer = 0;
  let destroyed = false;

  const setOpen = (open) => { panel.hidden = !open; launcher.setAttribute("aria-expanded", String(open)); if (open) input.focus(); };
  const addMessage = (side, text, kind = "") => {
    const message = document.createElement("div");
    message.className = `pap-chat-message pap-chat-message--${side}`;
    if (kind) message.dataset.kind = kind;
    message.textContent = text;
    messages.append(message);
    messages.scrollTop = messages.scrollHeight;
    return message;
  };

  const onLaunch = () => setOpen(panel.hidden);
  const onClose = () => setOpen(false);
  const onSubmit = (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text || pending) return;
    addMessage("user", text);
    input.value = "";
    pending = true;
    input.disabled = true;
    const kind = chatResponderForMode(mode);
    const responder = controllers.find((controller) => controller.kind === kind);
    responder?.pauseForResponse();
    const typing = addMessage("pet", "", kind);
    typing.classList.add("pap-chat-message--typing");
    typing.innerHTML = `<span class="pap-chat-avatar" aria-hidden="true">${kind === "cat" ? "🐱" : "🐶"}</span><span class="pap-typing-dots" aria-label="กำลังพิมพ์"><i></i><i></i><i></i></span>`;
    responseTimer = window.setTimeout(() => {
      if (destroyed) return;
      const response = randomItem(kind === "cat" ? CAT_REPLIES : DOG_REPLIES);
      typing.classList.remove("pap-chat-message--typing");
      typing.classList.add("pap-chat-message--reply");
      typing.innerHTML = `<span class="pap-chat-avatar" aria-hidden="true">${kind === "cat" ? "🐱" : "🐶"}</span><span></span>`;
      typing.lastElementChild.textContent = response;
      responder?.reactAndResume();
      pending = false;
      input.disabled = false;
      input.focus();
    }, wait(300, 601));
  };
  launcher.addEventListener("click", onLaunch);
  close.addEventListener("click", onClose);
  form.addEventListener("submit", onSubmit);
  return { shell, destroy() { destroyed = true; clearTimeout(responseTimer); launcher.removeEventListener("click", onLaunch); close.removeEventListener("click", onClose); form.removeEventListener("submit", onSubmit); shell.remove(); } };
}

export function initPetExperience({ mode }) {
  if (document.querySelector(".pap-mascot-stage") || location.pathname.endsWith("/admin.html")) return null;
  if (!["cat", "dog", "both"].includes(mode)) return null;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = matchMedia("(max-width: 700px)").matches;
  const stage = document.createElement("div");
  stage.className = "pap-mascot-stage";
  stage.setAttribute("aria-hidden", "true");
  document.body.append(stage);
  const kinds = mascotKindsForMode(mode);
  const controllers = kinds.map((kind, index) => new MascotController(kind, stage, index, reducedMotion, mobile));
  controllers.forEach((controller) => controller.setPeers(controllers));
  controllers.forEach((controller) => controller.start());
  const chat = createChat(mode, controllers);
  let pointerFrame = 0;
  const onPointerMove = (event) => {
    if (pointerFrame || mobile || reducedMotion) return;
    pointerFrame = requestAnimationFrame(() => { pointerFrame = 0; controllers.forEach((controller) => controller.look(event.clientX, event.clientY)); });
  };
  addEventListener("pointermove", onPointerMove, { passive:true });
  let scrollFrame = 0;
  const onScroll = () => {
    if (scrollFrame || reducedMotion) return;
    scrollFrame = requestAnimationFrame(() => { scrollFrame = 0; controllers.forEach((controller) => controller.syncWithTarget()); });
  };
  addEventListener("scroll", onScroll, { passive:true });
  const syncHorrorVisibility = () => {
    const hidden = document.body.classList.contains("horror");
    stage.hidden = hidden;
    chat.shell.hidden = hidden;
  };
  const horrorObserver = new MutationObserver(syncHorrorVisibility);
  syncHorrorVisibility();
  horrorObserver.observe(document.body, { attributes:true, attributeFilter:["class"] });
  let destroyed = false;
  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    removeEventListener("pointermove", onPointerMove);
    removeEventListener("scroll", onScroll);
    removeEventListener("pagehide", destroy);
    if (pointerFrame) cancelAnimationFrame(pointerFrame);
    if (scrollFrame) cancelAnimationFrame(scrollFrame);
    horrorObserver.disconnect();
    chat.destroy();
    controllers.forEach((controller) => controller.destroy());
    stage.remove();
  };
  addEventListener("pagehide", destroy, { once:true });
  return { controllers, chat:chat.shell, destroy };
}
