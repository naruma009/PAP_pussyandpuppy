import { createMascotVisual, renderMascot, setMascotVisible } from "./pet-mascot-visuals.js";

const CAT_REPLIES = ["เหมียว", "เหมียววว~", "เมี๊ยว?", "เหมียว!", "เมี๊ยววว", "...เหมียว"];
const DOG_REPLIES = ["โฮ่ง!", "โฮ่งโฮ่ง!", "บ๊อก!", "บ๊อกบ๊อก", "โฮ่งงง", "แฮ่ก ๆ... โฮ่ง!"];
const IDLE_STATES = ["idle", "sit", "sleep", "curious"];

const randomItem = (items) => items[Math.floor(Math.random() * items.length)];
const wait = (minimum, spread) => minimum + Math.floor(Math.random() * spread);
export const mascotKindsForMode = (mode) => mode === "both" ? ["cat", "dog"] : [mode];
export const chatResponderForMode = (mode) => mode === "both" ? randomItem(["cat", "dog"]) : mode;

class MascotController {
  constructor(kind, stage, index, reducedMotion, mobile) {
    this.kind = kind;
    this.visual = createMascotVisual(kind);
    this.model = { state:"idle", direction:index ? "left" : "right", x:index ? innerWidth - 120 : 28, y:10 + index * 6, duration:0, lookX:0, lookY:0 };
    this.reducedMotion = reducedMotion;
    this.mobile = mobile;
    this.timer = 0;
    this.paused = false;
    stage.append(this.visual.root);
    this.draw();
  }

  draw() { renderMascot(this.visual, this.model); }

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
    if (Math.random() < (this.mobile ? .38 : .58)) this.walk();
    else this.rest();
  }

  walk() {
    const margin = 18;
    const leave = !this.mobile && Math.random() < .13;
    const cards = [...document.querySelectorAll(".product-card")].filter((card) => {
      const rect = card.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < innerHeight;
    });
    let target = leave ? (Math.random() < .5 ? -90 : innerWidth + 20) : margin + Math.random() * Math.max(1, innerWidth - 110);
    if (!leave && cards.length && Math.random() < .32) {
      const rect = randomItem(cards).getBoundingClientRect();
      target = Math.max(margin, Math.min(innerWidth - 90, rect.left + rect.width * .5));
    }
    const distance = Math.abs(target - this.model.x);
    this.model.direction = target < this.model.x ? "left" : "right";
    this.model.state = "walk";
    this.model.duration = Math.max(1100, Math.min(5200, distance * (this.mobile ? 10 : 7)));
    this.model.x = target;
    this.draw();
    this.schedule(this.model.duration + wait(350, 900));
  }

  rest() {
    this.model.state = randomItem(IDLE_STATES);
    this.model.duration = 240;
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

  react() {
    this.paused = true;
    clearTimeout(this.timer);
    this.model.state = Math.random() < .7 ? "happy" : "curious";
    this.model.duration = 180;
    this.draw();
    this.timer = window.setTimeout(() => { this.paused = false; this.rest(); }, 1300);
  }

  destroy() { clearTimeout(this.timer); this.visual.root.remove(); }
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

  launcher.addEventListener("click", () => setOpen(panel.hidden));
  close.addEventListener("click", () => setOpen(false));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text || pending) return;
    addMessage("user", text);
    input.value = "";
    pending = true;
    input.disabled = true;
    const typing = addMessage("pet", "...");
    const kind = chatResponderForMode(mode);
    window.setTimeout(() => {
      const response = randomItem(kind === "cat" ? CAT_REPLIES : DOG_REPLIES);
      typing.dataset.kind = kind;
      typing.textContent = `${kind === "cat" ? "🐱" : "🐶"} ${response}`;
      controllers.find((controller) => controller.kind === kind)?.react();
      pending = false;
      input.disabled = false;
      input.focus();
    }, wait(300, 601));
  });
  return shell;
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
  controllers.forEach((controller) => controller.start());
  const chat = createChat(mode, controllers);
  let pointerFrame = 0;
  const onPointerMove = (event) => {
    if (pointerFrame || mobile || reducedMotion) return;
    pointerFrame = requestAnimationFrame(() => { pointerFrame = 0; controllers.forEach((controller) => controller.look(event.clientX, event.clientY)); });
  };
  addEventListener("pointermove", onPointerMove, { passive:true });
  const horrorObserver = new MutationObserver(() => {
    const hidden = document.body.classList.contains("horror");
    stage.hidden = hidden;
    chat.hidden = hidden;
  });
  horrorObserver.observe(document.body, { attributes:true, attributeFilter:["class"] });
  addEventListener("pagehide", () => { removeEventListener("pointermove", onPointerMove); if (pointerFrame) cancelAnimationFrame(pointerFrame); horrorObserver.disconnect(); controllers.forEach((controller) => controller.destroy()); }, { once:true });
  return { controllers, chat };
}
