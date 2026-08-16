const FEED_REPLIES = {
  cat:["เหมียวว~", "อีก!", "พอใช้ได้", "นี่ของฉันแล้ว", "เมี๊ยว!"],
  dog:["โฮ่ง!", "อีกได้ไหม!", "เย้!", "อร่อย!", "บ๊อกบ๊อก"]
};
const PET_REPLIES = {
  cat:["ครืดด...", "ตรงนั้นแหละ", "อย่าหยุดนะ", "วันนี้ยอมก็ได้"],
  dog:["ชอบที่สุด!", "ลูบอีก!", "เย้ เย้!", "เป็นเพื่อนกันแล้วนะ"]
};
const QUESTION_POOLS = {
  cat:[
    { text:"ช่วงนี้น้องจ้องกำแพงนานผิดปกติไหม?", answers:[{ text:"ไม่เลย กำแพงยังปลอดภัย", mood:"sleepy", weight:2 },{ text:"บางครั้ง เหมือนกำลังรับสัญญาณ", mood:"domination", weight:2 },{ text:"นานจนกำแพงสารภาพ", mood:"judge", weight:3 }] },
    { text:"ถ้ามีกล่องวางอยู่กลางห้อง น้องทำอะไรเป็นอย่างแรก?", answers:[{ text:"เข้าไปทันทีโดยไม่อ่านคู่มือ", mood:"new-home", weight:3 },{ text:"นั่งบนฝากล่อง", mood:"judge", weight:2 },{ text:"วิ่งชนแล้วหายตัว", mood:"energy", weight:3 }] },
    { text:"น้องเคยจ้องคุณเหมือนกำลังตัดสินผลงานหรือไม่?", answers:[{ text:"ทุกวันตอนประเมิน KPI", mood:"judge", weight:3 },{ text:"เฉพาะตอนอาหารช้า", mood:"domination", weight:2 },{ text:"ไม่ น้องหลับอยู่", mood:"sleepy", weight:2 }] },
    { text:"เวลาคุณเรียกชื่อ น้องตอบสนองระดับไหน?", answers:[{ text:"หูขยับหนึ่งมิลลิเมตร", mood:"judge", weight:3 },{ text:"เดินมา ถ้ามีค่าตอบแทน", mood:"domination", weight:2 },{ text:"วิ่งมาแล้ววิ่งผ่าน", mood:"energy", weight:3 }] },
    { text:"ช่วงตี 3 น้องกำลังทำอะไร?", answers:[{ text:"วิ่งแข่งกับวิญญาณ", mood:"energy", weight:3 },{ text:"ประชุมลับใต้โต๊ะ", mood:"domination", weight:3 },{ text:"นอนทับหมอนของคุณ", mood:"sleepy", weight:3 }] },
    { text:"เมื่อน้องเห็นพื้นที่ว่างบนชั้นสูง ปฏิกิริยาคือ?", answers:[{ text:"ยึดพื้นที่ทันที", mood:"domination", weight:3 },{ text:"ประเมินมนุษย์ที่วางของขวาง", mood:"judge", weight:2 },{ text:"ปีนขึ้นแล้วหลับ", mood:"sleepy", weight:2 }] },
    { text:"ของชิ้นไหนได้รับอนุญาตให้อยู่ในบ้านมากที่สุด?", answers:[{ text:"กล่องพัสดุทุกใบ", mood:"new-home", weight:3 },{ text:"ของเล่นที่หายใต้ตู้", mood:"energy", weight:2 },{ text:"เตียงมนุษย์", mood:"sleepy", weight:3 }] },
    { text:"ถ้าถ้วยอาหารว่างก่อนเวลา 4 นาที น้องจะทำอย่างไร?", answers:[{ text:"ยื่นคำร้องด้วยเสียงเหมียว", mood:"judge", weight:3 },{ text:"เริ่มแผนโค่นรัฐบาล", mood:"domination", weight:3 },{ text:"ไปนอนรออย่างมีศักดิ์ศรี", mood:"sleepy", weight:2 }] }
  ],
  dog:[
    { text:"ถ้าได้ยินเสียงถุงขนมจากอีกห้อง น้องใช้เวลากี่วินาทีมาถึง?", answers:[{ text:"น้อยกว่าหนึ่ง วิทยาศาสตร์ยังอธิบายไม่ได้", mood:"snack", weight:3 },{ text:"ประมาณสามวินาที", mood:"energy", weight:2 },{ text:"มาถึงก่อนเปิดถุง", mood:"security", weight:2 }] },
    { text:"เวลาเจ้าของกลับบ้าน น้องตื่นเต้นระดับไหน?", answers:[{ text:"กระดิกหางอย่างสุภาพ", mood:"friend", weight:2 },{ text:"พลังงานเกิน 300%", mood:"energy", weight:3 },{ text:"แจ้งเตือนทั้งหมู่บ้าน", mood:"security", weight:3 }] },
    { text:"ถ้าเห็นคนแปลกหน้า น้องคิดว่าเป็นเพื่อนหรือผู้บุกรุก?", answers:[{ text:"เพื่อนใหม่แน่นอน", mood:"friend", weight:3 },{ text:"ขอตรวจบัตรก่อน", mood:"security", weight:3 },{ text:"ถ้ามีขนมคือเพื่อน", mood:"snack", weight:2 }] },
    { text:"ของเล่นชิ้นโปรดมีสภาพเหลือกี่เปอร์เซ็นต์?", answers:[{ text:"ประมาณ 90% ดูแลดีมาก", mood:"friend", weight:2 },{ text:"เหลือ 12% แต่ยังรักอยู่", mood:"energy", weight:3 },{ text:"เหลือเพียงความทรงจำ", mood:"snack", weight:2 }] },
    { text:"ถ้าคุณพูดคำว่า “ไปเที่ยว” น้องมีปฏิกิริยาอย่างไร?", answers:[{ text:"ยืนรอหน้าประตูแล้ว", mood:"travel", weight:3 },{ text:"คาบสายจูงมารายงานตัว", mood:"security", weight:2 },{ text:"วิ่งเป็นวงกลม 14 รอบ", mood:"energy", weight:3 }] },
    { text:"เมื่อน้องได้กลิ่นอาหารจากระยะไกล ระบบใดทำงานก่อน?", answers:[{ text:"จมูกเรดาร์", mood:"snack", weight:3 },{ text:"หางส่งสัญญาณ", mood:"friend", weight:2 },{ text:"ขาทั้งสี่เปิดโหมดเทอร์โบ", mood:"energy", weight:3 }] },
    { text:"ตอนกลางคืนมีเสียงหน้าบ้าน น้องรับตำแหน่งอะไร?", answers:[{ text:"หัวหน้าฝ่ายรักษาความปลอดภัย", mood:"security", weight:3 },{ text:"ฝ่ายต้อนรับเพื่อนใหม่", mood:"friend", weight:2 },{ text:"ฝ่ายหลบอยู่หลังเจ้าของ", mood:"travel", weight:2 }] },
    { text:"วันหยุดในฝันของน้องหน้าตาแบบไหน?", answers:[{ text:"ออกเที่ยวตั้งแต่เช้า", mood:"travel", weight:3 },{ text:"พบเพื่อนทุกคนในสวน", mood:"friend", weight:3 },{ text:"บุฟเฟต์ขนมไม่จำกัด", mood:"snack", weight:3 }] }
  ]
};
const MOOD_POOLS = {
  cat:{
    sleepy:{ title:"วันนี้น้องอยากนอน 23 ชั่วโมง", description:"ชั่วโมงที่เหลือมีไว้ย้ายจากเตียงไปนอนในกล่อง", badge:"Sleep Mode", meter:28, categories:["Beds"] },
    judge:{ title:"น้องกำลังตัดสินผลงานมนุษย์", description:"คะแนนยังไม่ประกาศ แต่การเสิร์ฟอาหารตรงเวลาช่วยได้", badge:"Human Review", meter:67, categories:["Treats", "Accessories"] },
    domination:{ title:"แมวของคุณกำลังวางแผนครองโลก", description:"แผนยังเป็นความลับ ของเล่นหนึ่งชิ้นอาจซื้อเวลาให้มนุษยชาติ", badge:"Mastermind", meter:94, categories:["Toys"] },
    "new-home":{ title:"น้องต้องการกล่องใหม่", description:"บ้านเดิมยังใช้ได้ แต่มาตรฐานอสังหาฯ ของแมวเปลี่ยนทุกสัปดาห์", badge:"Box Hunter", meter:53, categories:["Beds"] },
    energy:{ title:"ตรวจพบพลังงานตี 3", description:"เตรียมรับเสียงวิ่งผ่านทางเดินโดยไม่มีต้นเหตุที่ยืนยันได้", badge:"3 AM Zoomies", meter:98, categories:["Toys"] }
  },
  dog:{
    friend:{ title:"น้องเชื่อว่าทุกคนคือเพื่อน", description:"รวมถึงคนส่งของ เพื่อนบ้าน และใบไม้ที่ปลิวผ่านประตู", badge:"Best Friend", meter:78, categories:["Accessories"] },
    snack:{ title:"ระบบตรวจจับขนมทำงานจากระยะไกล", description:"ความแม่นยำสูงกว่าเรดาร์และเปิดใช้งานตลอด 24 ชั่วโมง", badge:"Snack Radar", meter:88, categories:["Treats"] },
    energy:{ title:"พลังงานเกิน 300%", description:"ควรปล่อยพลังอย่างเป็นระบบก่อนโซฟาจะรับหน้าที่แทน", badge:"Turbo Mode", meter:100, categories:["Toys"] },
    travel:{ title:"น้องต้องการออกเที่ยวเดี๋ยวนี้", description:"สายจูงพร้อม หางพร้อม เหลือเพียงมนุษย์ที่ยังใส่รองเท้าไม่เสร็จ", badge:"Adventure Now", meter:85, categories:["Accessories"] },
    security:{ title:"น้องคือหัวหน้าฝ่ายรักษาความปลอดภัย", description:"ทุกเสียงต้องผ่านการตรวจสอบ แม้กระทั่งเสียงตู้เย็น", badge:"Security Chief", meter:72, categories:["Accessories"] }
  }
};
const randomItem = (items) => items[Math.floor(Math.random() * items.length)];
const randomBetween = (minimum, maximum) => minimum + Math.floor(Math.random() * (maximum - minimum + 1));
const sampleQuestions = (questions, count = 3) => {
  const pool = [...questions];
  for (let index = pool.length - 1; index > 0; index--) { const target = Math.floor(Math.random() * (index + 1)); [pool[index], pool[target]] = [pool[target], pool[index]]; }
  return pool.slice(0, count);
};

export function createPetPersonality({ mode, controllers, products, sound, mobile, reducedMotion, createChaosSwarm }) {
  const root = document.createElement("div");
  root.className = "pap-personality";
  root.innerHTML = `<button class="pap-chaos-trigger" type="button" aria-label="ความลับ">✦</button>`;
  document.body.append(root);
  const moodButton = document.querySelector("[data-mood-assessment]");
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
    overlay = document.createElement("div");
    overlay.className = "pap-mood-overlay";
    root.append(overlay);
    const startQuiz = (species) => {
      const scores = {};
      const questions = sampleQuestions(QUESTION_POOLS[species]);
      let step = 0;
      const drawResult = () => {
        const best = Math.max(...Object.values(scores));
        const candidates = Object.keys(scores).filter((key) => scores[key] >= best - 1);
        const mood = MOOD_POOLS[species][randomItem(candidates)];
        const eligible = products.filter((product) => mood.categories.includes(product.category) && (product.petType === species || product.petType === "both"));
        overlay.innerHTML = `<section class="pap-mood-card pap-mood-result"><button class="pap-mood-close" type="button" aria-label="ปิด">×</button><span class="pap-mood-badge">${mood.badge}</span><h2>${mood.title}</h2><p>${mood.description}</p><div class="pap-mood-meter"><i style="width:${mood.meter}%"></i></div><strong>แนะนำหมวดหมู่: ${mood.categories.join(" / ")}</strong><div class="pap-mood-products"></div></section>`;
        const list = overlay.querySelector(".pap-mood-products");
        eligible.slice(0, 3).forEach((product) => { const link = document.createElement("a"); link.href = `product.html?id=${product.id}`; link.textContent = `${product.emoji || "🐾"} ${product.name}`; list.append(link); });
        overlay.querySelector(".pap-mood-close").addEventListener("click", closeOverlay, { once:true });
      };
      const drawQuestion = () => {
        const question = questions[step];
        overlay.innerHTML = `<section class="pap-mood-card"><button class="pap-mood-close" type="button" aria-label="ปิด">×</button><span>คำถาม ${step + 1} / ${questions.length}</span><h2>${question.text}</h2><div class="pap-mood-options"></div></section>`;
        const options = overlay.querySelector(".pap-mood-options");
        question.answers.forEach((answer) => { const button = document.createElement("button"); button.type = "button"; button.textContent = answer.text; button.addEventListener("click", () => { scores[answer.mood] = (scores[answer.mood] || 0) + answer.weight; step++; step < questions.length ? drawQuestion() : drawResult(); }, { once:true }); options.append(button); });
        overlay.querySelector(".pap-mood-close").addEventListener("click", closeOverlay, { once:true });
      };
      drawQuestion();
    };
    if (mode === "both") {
      overlay.innerHTML = `<section class="pap-mood-card pap-mood-species"><button class="pap-mood-close" type="button" aria-label="ปิด">×</button><span>PAP Mood Check</span><h2>วันนี้อยากวิเคราะห์ใคร?</h2><div class="pap-mood-options"><button type="button" data-mood-species="cat">🐱 น้องแมว</button><button type="button" data-mood-species="dog">🐶 น้องหมา</button></div></section>`;
      overlay.querySelector(".pap-mood-options").addEventListener("click", (event) => { const species = event.target.closest("[data-mood-species]")?.dataset.moodSpecies; if (species) startQuiz(species); });
      overlay.querySelector(".pap-mood-close").addEventListener("click", closeOverlay, { once:true });
    } else startQuiz(mode);
  };

  const stopChaos = () => {
    if (!chaos) return;
    clearTimeout(chaos.timer);
    timers.delete(chaos.timer);
    chaos.swarm?.destroy();
    chaos.node?.remove();
    chaos.controllers.forEach((controller) => controller.endInteraction("chaos"));
    chaos = null;
  };
  const startChaos = () => {
    if (chaos || controllers.some((controller) => controller.isLocked())) return;
    if (!controllers.every((controller) => controller.beginInteraction("chaos"))) { controllers.forEach((controller) => controller.endInteraction("chaos")); return; }
    removeMenu();
    if (reducedMotion) {
      const node = document.createElement("div");
      node.className = "pap-chaos pap-chaos--reduced";
      root.append(node);
      for (let index = 0; index < 4; index++) {
        const pet = document.createElement("span");
        pet.textContent = randomItem(mode === "cat" ? ["🐱"] : mode === "dog" ? ["🐶"] : ["🐱", "🐶"]);
        pet.style.left = `${12 + index * 24}%`;
        node.append(pet);
      }
      chaos = { node, swarm:null, controllers, timer:0 };
      chaos.timer = later(stopChaos, 3000);
    } else {
      const count = randomBetween(mobile ? 5 : 12, mobile ? 7 : 16);
      chaos = { node:null, swarm:null, controllers, timer:0 };
      chaos.swarm = createChaosSwarm({ count, onComplete:stopChaos });
      chaos.timer = later(stopChaos, 9500);
    }
    sound("pet");
  };
  moodButton?.addEventListener("click", renderMood);
  chaosButton.addEventListener("click", startChaos);

  return {
    root,
    setHidden(hidden) { root.hidden = hidden; if (moodButton) moodButton.hidden = hidden; if (hidden) { removeMenu(); closeOverlay(); stopChaos(); } },
    destroy() {
      if (destroyed) return;
      timers.forEach(clearTimeout); timers.clear();
      stopChaos(); removeMenu(); closeOverlay();
      destroyed = true;
      moodButton?.removeEventListener("click", renderMood);
      chaosButton.removeEventListener("click", startChaos);
      actionListeners.forEach(([node, onClick, onKey]) => { node.removeEventListener("click", onClick); node.removeEventListener("keydown", onKey); });
      root.remove();
    }
  };
}
