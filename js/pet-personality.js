const FEED_REPLIES = {
  cat:["เหมียวว~", "อีก!", "พอใช้ได้", "นี่ของฉันแล้ว", "เมี๊ยว!"],
  dog:["โฮ่ง!", "อีกได้ไหม!", "เย้!", "อร่อย!", "บ๊อกบ๊อก"]
};
const PET_REPLIES = {
  cat:["ครืดด...", "ตรงนั้นแหละ", "อย่าหยุดนะ", "วันนี้ยอมก็ได้"],
  dog:["ชอบที่สุด!", "ลูบอีก!", "เย้ เย้!", "เป็นเพื่อนกันแล้วนะ"]
};
const QUESTIONS = [
  { text:"ช่วงนี้น้องจ้องกำแพงบ่อยแค่ไหน?", answers:[{ text:"แทบไม่เคย", mood:"sleepy", weight:2 },{ text:"วันละนิด เหมือนเช็กงาน", mood:"ceo", weight:2 },{ text:"นานจนกำแพงเริ่มกลัว", mood:"domination", weight:3 }] },
  { text:"ถ้ามีกล่อง 3 ใบ น้องจะเลือกแบบไหน?", answers:[{ text:"กล่องที่เล็กที่สุด", mood:"new-home", weight:2 },{ text:"วิ่งชนทั้งสามใบ", mood:"energy", weight:3 },{ text:"นอนทับฝากล่อง", mood:"sleepy", weight:3 },{ text:"ให้มนุษย์เลือกแทน", mood:"ceo", weight:2 }] },
  { text:"ตอนกลางคืนพฤติกรรมน้องเป็นแบบไหน?", answers:[{ text:"หลับครบ 23 ชั่วโมง", mood:"sleepy", weight:3 },{ text:"ประชุมลับกับเงาตัวเอง", mood:"domination", weight:3 },{ text:"วิ่งแข่งกับสิ่งที่มองไม่เห็น", mood:"energy", weight:3 },{ text:"ตรวจบ้านเหมือนเป็นเจ้าของ", mood:"ceo", weight:2 }] }
];
const MOODS = {
  sleepy:{ title:"วันนี้น้องอยากนอน 23 ชั่วโมง", description:"พลังงานทั้งหมดถูกจัดสรรให้การงีบอย่างมีประสิทธิภาพ", badge:"Sleep Mode", meter:28, categories:["Beds"] },
  ceo:{ title:"น้องคิดว่าตัวเองเป็น CEO", description:"ทุกคนในบ้านคือพนักงาน และมื้อเย็นคือการประชุมสำคัญ", badge:"Executive", meter:64, categories:["Accessories"] },
  domination:{ title:"น้องกำลังวางแผนครองโลก", description:"แผนยังเป็นความลับ แต่ของเล่นหนึ่งชิ้นอาจซื้อเวลาให้มนุษยชาติ", badge:"Mastermind", meter:91, categories:["Toys"] },
  "new-home":{ title:"น้องกำลังมองหาบ้านใหม่", description:"ไม่ต้องตกใจ น้องหมายถึงกล่องหรือเตียงอีกใบในบ้านเดิม", badge:"House Hunter", meter:52, categories:["Beds"] },
  energy:{ title:"พลังงานสะสมเกินขีดจำกัด", description:"ควรปล่อยพลังอย่างเป็นระบบก่อนเฟอร์นิเจอร์จะรับหน้าที่แทน", badge:"High Energy", meter:96, categories:["Toys"] }
};
const randomItem = (items) => items[Math.floor(Math.random() * items.length)];
const randomBetween = (minimum, maximum) => minimum + Math.floor(Math.random() * (maximum - minimum + 1));

export function createPetPersonality({ mode, controllers, products, sound, mobile, reducedMotion }) {
  const root = document.createElement("div");
  root.className = "pap-personality";
  root.innerHTML = `<button class="pap-mood-launcher" type="button">วันนี้น้องคิดอะไรอยู่?</button><button class="pap-chaos-trigger" type="button" aria-label="ความลับ">✦</button>`;
  document.body.append(root);
  const moodButton = root.querySelector(".pap-mood-launcher");
  const chaosButton = root.querySelector(".pap-chaos-trigger");
  const timers = new Set();
  const actionListeners = [];
  let overlay = null;
  let menu = null;
  let chaos = null;
  let destroyed = false;

  const later = (callback, delay) => { const timer = setTimeout(() => { timers.delete(timer); if (!destroyed) callback(); }, delay); timers.add(timer); return timer; };
  const removeMenu = () => { menu?.remove(); menu = null; };
  const bubbleFor = (controller, text, owner) => {
    const bubble = document.createElement("div");
    bubble.className = `pap-action-bubble pap-action-bubble--${controller.kind}`;
    bubble.textContent = text;
    root.append(bubble);
    const rect = controller.visual.root.getBoundingClientRect();
    bubble.style.left = `${Math.max(8, Math.min(innerWidth - 180, rect.left - 40))}px`;
    bubble.style.top = `${Math.max(70, rect.top - 52)}px`;
    later(() => { bubble.remove(); controller.endInteraction(owner); }, randomBetween(1500, 3000));
  };
  const performAction = (controller, action) => {
    const owner = `direct-${action}`;
    removeMenu();
    if (!controller.beginInteraction(owner)) return;
    controller.showInteractionState(owner, action === "feed" ? "excited" : "relaxed");
    bubbleFor(controller, randomItem((action === "feed" ? FEED_REPLIES : PET_REPLIES)[controller.kind]), owner);
    sound("pet");
  };
  const openMenu = (controller) => {
    if (controller.isLocked() || chaos) return;
    removeMenu();
    menu = document.createElement("div");
    menu.className = "pap-action-menu";
    menu.innerHTML = `<button type="button" data-pet-action="feed">🍪 ให้อาหาร</button><button type="button" data-pet-action="pet">🤍 ลูบหัว</button>`;
    root.append(menu);
    const rect = controller.visual.root.getBoundingClientRect();
    menu.style.left = `${Math.max(8, Math.min(innerWidth - 190, rect.left - 45))}px`;
    menu.style.top = `${Math.max(70, Math.min(innerHeight - 110, rect.top - 76))}px`;
    menu.addEventListener("click", (event) => { const action = event.target.closest("[data-pet-action]")?.dataset.petAction; if (action) performAction(controller, action); });
  };
  controllers.forEach((controller) => {
    const node = controller.visual.root;
    node.setAttribute("role", "button");
    node.setAttribute("tabindex", "0");
    node.setAttribute("aria-label", `${controller.kind === "cat" ? "แมว" : "หมา"} PAP — เปิดเมนู interaction`);
    const onClick = () => openMenu(controller);
    const onKey = (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openMenu(controller); } };
    node.addEventListener("click", onClick);
    node.addEventListener("keydown", onKey);
    actionListeners.push([node, onClick, onKey]);
  });

  const closeOverlay = () => { overlay?.remove(); overlay = null; };
  const renderMood = () => {
    closeOverlay();
    const scores = {};
    let step = 0;
    overlay = document.createElement("div");
    overlay.className = "pap-mood-overlay";
    root.append(overlay);
    const drawResult = () => {
      const best = Math.max(...Object.values(scores));
      const candidates = Object.keys(scores).filter((key) => scores[key] >= best - 1);
      const mood = MOODS[randomItem(candidates)];
      const eligible = products.filter((product) => mood.categories.includes(product.category) && (mode === "both" || product.petType === mode || product.petType === "both"));
      overlay.innerHTML = `<section class="pap-mood-card pap-mood-result"><button class="pap-mood-close" type="button" aria-label="ปิด">×</button><span class="pap-mood-badge">${mood.badge}</span><h2>${mood.title}</h2><p>${mood.description}</p><div class="pap-mood-meter"><i style="width:${mood.meter}%"></i></div><strong>แนะนำหมวดหมู่: ${mood.categories.join(" / ")}</strong><div class="pap-mood-products"></div></section>`;
      const list = overlay.querySelector(".pap-mood-products");
      eligible.slice(0, 3).forEach((product) => { const link = document.createElement("a"); link.href = `product.html?id=${product.id}`; link.textContent = `${product.emoji || "🐾"} ${product.name}`; list.append(link); });
      overlay.querySelector(".pap-mood-close").addEventListener("click", closeOverlay, { once:true });
    };
    const drawQuestion = () => {
      const question = QUESTIONS[step];
      overlay.innerHTML = `<section class="pap-mood-card"><button class="pap-mood-close" type="button" aria-label="ปิด">×</button><span>คำถาม ${step + 1} / ${QUESTIONS.length}</span><h2>${question.text}</h2><div class="pap-mood-options"></div></section>`;
      const options = overlay.querySelector(".pap-mood-options");
      question.answers.forEach((answer) => { const button = document.createElement("button"); button.type = "button"; button.textContent = answer.text; button.addEventListener("click", () => { scores[answer.mood] = (scores[answer.mood] || 0) + answer.weight; step++; step < QUESTIONS.length ? drawQuestion() : drawResult(); }, { once:true }); options.append(button); });
      overlay.querySelector(".pap-mood-close").addEventListener("click", closeOverlay, { once:true });
    };
    drawQuestion();
  };

  const stopChaos = () => {
    if (!chaos) return;
    clearTimeout(chaos.timer);
    timers.delete(chaos.timer);
    chaos.node.remove();
    chaos.controllers.forEach((controller) => controller.endInteraction("chaos"));
    chaos = null;
  };
  const startChaos = () => {
    if (chaos || controllers.some((controller) => controller.isLocked())) return;
    if (!controllers.every((controller) => controller.beginInteraction("chaos"))) { controllers.forEach((controller) => controller.endInteraction("chaos")); return; }
    removeMenu();
    const node = document.createElement("div");
    node.className = `pap-chaos ${reducedMotion ? "pap-chaos--reduced" : ""}`;
    root.append(node);
    const count = reducedMotion ? 4 : randomBetween(mobile ? 6 : 12, mobile ? 9 : 20);
    for (let index = 0; index < count; index++) {
      const pet = document.createElement("span");
      pet.textContent = randomItem(mode === "cat" ? ["🐱"] : mode === "dog" ? ["🐶"] : ["🐱", "🐶"]);
      pet.style.setProperty("--chaos-x", `${randomBetween(-10, 95)}vw`);
      pet.style.setProperty("--chaos-y", `${randomBetween(5, 90)}vh`);
      pet.style.setProperty("--chaos-delay", `${randomBetween(0, 650)}ms`);
      pet.style.setProperty("--chaos-turn", `${randomBetween(-45, 45)}deg`);
      node.append(pet);
    }
    chaos = { node, controllers, timer:0 };
    sound("pet");
    chaos.timer = later(stopChaos, reducedMotion ? 3000 : randomBetween(3000, 6000));
  };
  moodButton.addEventListener("click", renderMood);
  chaosButton.addEventListener("click", startChaos);

  return {
    root,
    setHidden(hidden) { root.hidden = hidden; if (hidden) { removeMenu(); closeOverlay(); stopChaos(); } },
    destroy() {
      if (destroyed) return;
      timers.forEach(clearTimeout); timers.clear();
      stopChaos(); removeMenu(); closeOverlay();
      destroyed = true;
      moodButton.removeEventListener("click", renderMood);
      chaosButton.removeEventListener("click", startChaos);
      actionListeners.forEach(([node, onClick, onKey]) => { node.removeEventListener("click", onClick); node.removeEventListener("keydown", onKey); });
      root.remove();
    }
  };
}
