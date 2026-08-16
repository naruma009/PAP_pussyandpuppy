(function () {
  const root = document.documentElement;
  const read = (key, values, fallback) => { try { const value = localStorage.getItem(key); return values.includes(value) ? value : fallback; } catch { return fallback; } };
  const language = read("pap-language", ["th", "en"], "th");
  const theme = read("pap-theme", ["light", "dark"], "light");
  const pet = read("pap-mode", ["cat", "dog", "both"], "both");
  root.lang = language; root.dataset.language = language; root.dataset.theme = theme; root.dataset.pet = pet; root.classList.add("ui-booting");
  let revealed = false;
  const reveal = () => { if (revealed) return; revealed = true; root.classList.remove("ui-booting"); root.dataset.preferencesReady = ""; };
  const failSafe = setTimeout(reveal, 900);

  const messages = {
    navHome:["หน้าหลัก","Home"], navProducts:["สินค้า","Products"], allProducts:["ดูสินค้าทั้งหมด","View All Products"],
    skip:["ข้ามไปเนื้อหา","Skip to content"], login:["เข้าสู่ระบบ","Login"], cart:["ตะกร้าสินค้า","Cart"],
    landingTitle:["บ้านคุณเป็นทีมไหน?","Which team is your home?"], landingIntro:["เลือกเพื่อนขนฟูของคุณ แล้วเราเตรียมของโปรดให้เอง","Choose your furry crew and we’ll prepare their favorites."],
    catCopy:["ของดีที่เจ้านายอนุมัติ","Approved by your feline boss"], dogCopy:["พร้อมสนุกทุกวินาที","Ready for fun every second"], bothCopy:["สองทีม หนึ่งบ้านแสนสุข","Two teams, one happy home"],
    homeTitle:["ของโปรดสำหรับ","Favorites for"], bestFriend:["เพื่อนที่ดีที่สุด","your best friend"], homeCopy:["คัดของเล่น ของใช้ และขนมที่เติมความสุขให้ทุกเสียงเหมียวและทุกหางที่ส่าย","Toys, essentials, and treats for every meow and wagging tail."],
    moodCta:["วันนี้น้องคิดอะไรอยู่?","What is your pet thinking today?"], weekly:["ของโปรดประจำสัปดาห์","Weekly favorites"],
    cartTitle:["ตะกร้าความสุข","Cart of happiness"], cartIntro:["ตรวจของโปรดก่อนพากลับบ้าน","Check their favorites before bringing them home."], summary:["สรุปคำสั่งซื้อ","Order Summary"], total:["ยอดรวม","Total"],
    loginTitle:["เข้าสู่แก๊ง PAP","Join the PAP pack"], nickname:["ชื่อเล่น","Nickname"], demoLogin:["เข้าสู่ระบบแบบ Demo","Demo Login"],
    moodWho:["วันนี้อยากวิเคราะห์ใคร?","Who would you like to analyze today?"], catPet:["🐱 น้องแมว","🐱 Cat"], dogPet:["🐶 น้องหมา","🐶 Dog"],
    feed:["🍪 ให้อาหาร","🍪 Feed"], petAction:["🤍 ลูบหัว","🤍 Pet"], close:["ปิด","Close"], send:["ส่ง","Send"],
    chatAsk:["ถามน้อง PAP","Ask PAP Pet"], chatNote:["พวกน้องตอบตามภาษาของพวกน้อง — ไม่ใช่ AI","Pet-language replies — not AI"],
    shipping:["ที่อยู่จัดส่ง","Shipping Address"], orderSummary:["สรุปรายการ","Order Summary"], placeOrder:["ยืนยันคำสั่งซื้อ","Place Order"],
    emptyCart:["ตะกร้ายังว่างอยู่","Your cart is empty"], backProducts:["ไปเลือกของน่ารัก ๆ","Browse cute products"], checkout:["ชำระเงิน","Checkout"],
    added:["เพิ่มลงตะกร้าแล้ว!","Added to cart!"], stockLimit:["ถึงจำนวนสต็อกสูงสุดแล้ว","Stock limit reached"], outStock:["สินค้าหมด","Out of Stock"],
    soundOn:["เปิดเสียง — กดเพื่อปิด","Sound On — turn off"], soundOff:["ปิดเสียง — กดเพื่อเปิด","Sound Off — turn on"],
    light:["โหมดสว่าง","Light mode"], dark:["โหมดมืด","Dark mode"], changeMode:["เปลี่ยน Pet Mode","Change Pet Mode"],
    question:["คำถาม","Question"], recommend:["แนะนำหมวดหมู่:","Recommended category:"], noOrders:["ยังไม่มีคำสั่งซื้อ","No orders yet"]
  };
  Object.assign(messages, {
    forCat:["สำหรับแมว","For Cat"], forDog:["สำหรับหมา","For Dog"], forBoth:["สำหรับแมวและหมา","For Cat & Dog"],
    inStock:["มีสินค้า: {count}","In Stock: {count}"], inCart:["ในตะกร้า: {count}","In Cart: {count}"], notInCart:["ยังไม่อยู่ในตะกร้า","Not in cart"],
    addCart:["เพิ่มลงตะกร้า ＋","Add to Cart ＋"], petType:["ประเภทสัตว์","Pet Type"], stock:["สต็อก","Stock"], items:["{count} ชิ้น","{count} items"],
    productMissing:["ไม่พบสินค้านี้","Product not found"], backToProducts:["กลับไปเลือกสินค้า","Back to Products"], perItem:["/ ชิ้น","/ item"], remove:["ลบ","Remove"],
    helloDemo:["สวัสดี {name} — คุณกำลังใช้บัญชี Demo","Hello {name} — you are using a demo account"], loggedIn:["เข้าสู่ระบบแล้ว สวัสดี {name}!","Logged in. Hello {name}!"],
    addressHint:["กรอกข้อมูลเพื่อดูที่อยู่จัดส่ง","Enter your details to preview the shipping address"], orderConfirmed:["ยืนยันคำสั่งซื้อแล้ว","Order confirmed"], thanks:["ขอบคุณ!","Thank you!"],
    orderPlaced:["คำสั่งซื้อ {id} ถูกส่งเรียบร้อยแล้ว","Order {id} has been placed."], backHome:["กลับหน้าหลัก","Back to Home"], typing:["กำลังพิมพ์","Typing"], chatMessage:["ข้อความถึงน้อง","Message to your pet"], chatPlaceholder:["อยากรู้อะไร ถามน้องได้เลย","Ask your pet anything"],
    showLess:["แสดงน้อยลง ↑","Show Less ↑"], viewAll:["ดูทั้งหมด →","View All →"], age:["ช่วงวัย","Age"], search:["ค้นหา","Search"], priceRange:["ช่วงราคา","Price Range"], adult:["โตเต็มวัย","Adult"], senior:["สูงวัย","Senior"], noCategoryProducts:["ยังไม่มีสินค้าในหมวดนี้","No products in this category"],
    addFavorite:["เพิ่มเป็นรายการโปรด","Add to favorites"], removeFavorite:["นำออกจากรายการโปรด","Remove from favorites"], favoriteSaved:["เก็บไว้ในรายการโปรดแล้ว","Saved to favorites"], favoriteRemoved:["นำออกจากรายการโปรดแล้ว","Removed from favorites"], favoritesOnly:["เฉพาะรายการโปรด","Favorites only"], favoritesDeviceOnly:["บันทึกเฉพาะในอุปกรณ์นี้ ไม่ซิงก์กับบัญชี","Saved on this device only — not synced to your account"], noFavorites:["ยังไม่มีของโปรดในอุปกรณ์นี้","No favorites saved on this device yet"],
    searchPlaceholder:["ค้นหาชื่อ รายละเอียด หรือหมวดหมู่","Search name, description, or category"], clearSearch:["ล้างคำค้นหา","Clear search"], allRelevantPets:["สัตว์ที่เกี่ยวข้องทั้งหมด","All relevant pets"], catOnly:["แมว","Cat"], dogOnly:["หมา","Dog"], bothOnly:["ใช้ได้ทั้งคู่","Both"], hideOutOfStock:["ซ่อนสินค้าที่หมด","Hide out-of-stock"], sort:["เรียงตาม","Sort"], recommended:["แนะนำ","Recommended"], priceLowHigh:["ราคา: ต่ำไปสูง","Price: Low to High"], priceHighLow:["ราคา: สูงไปต่ำ","Price: High to Low"], nameAZ:["ชื่อ: A ถึง Z","Name: A to Z"], newest:["ใหม่ล่าสุด","Newest"], resetFilters:["ล้างตัวกรอง","Reset filters"], noSearchResults:["ดมหาแล้ว แต่ยังไม่เจอสินค้าที่ตรงกัน","We sniffed everywhere, but found no matching products"], tryFilters:["ลองเปลี่ยนคำค้นหาหรือตัวกรองดูนะ","Try a different search or filter"], searchCount:["กำลังดมหาของให้น้อง... เจอ {count} ชิ้น","Sniffing out goodies... {count} found"], productCount:["พบสินค้า {count} ชิ้น","{count} products found"]
  });
  const textPairs = [
    ["Home","หน้าหลัก","Home"],["Products","สินค้า","Products"],["ข้ามไปเนื้อหา","ข้ามไปเนื้อหา","Skip to content"],["ดูสินค้าทั้งหมด","ดูสินค้าทั้งหมด","View All Products"],
    ["บ้านคุณเป็นทีมไหน?","บ้านคุณเป็นทีมไหน?","Which team is your home?"],["เลือกเพื่อนขนฟูของคุณ แล้วเราเตรียมของโปรดให้เอง","เลือกเพื่อนขนฟูของคุณ แล้วเราเตรียมของโปรดให้เอง","Choose your furry crew and we’ll prepare their favorites."],
    ["ของดีที่เจ้านายอนุมัติ","ของดีที่เจ้านายอนุมัติ","Approved by your feline boss"],["พร้อมสนุกทุกวินาที","พร้อมสนุกทุกวินาที","Ready for fun every second"],["สองทีม หนึ่งบ้านแสนสุข","สองทีม หนึ่งบ้านแสนสุข","Two teams, one happy home"],
    ["ของโปรดสำหรับ","ของโปรดสำหรับ","Favorites for"],["เพื่อนที่ดีที่สุด","เพื่อนที่ดีที่สุด","your best friend"],["คัดของเล่น ของใช้ และขนมที่เติมความสุขให้ทุกเสียงเหมียวและทุกหางที่ส่าย","คัดของเล่น ของใช้ และขนมที่เติมความสุขให้ทุกเสียงเหมียวและทุกหางที่ส่าย","Toys, essentials, and treats for every meow and wagging tail."],
    ["วันนี้น้องคิดอะไรอยู่?","วันนี้น้องคิดอะไรอยู่?","What is your pet thinking today?"],["ของโปรดประจำสัปดาห์","ของโปรดประจำสัปดาห์","Weekly favorites"],
    ["ตะกร้าความสุข","ตะกร้าความสุข","Cart of happiness"],["ตรวจของโปรดก่อนพากลับบ้าน","ตรวจของโปรดก่อนพากลับบ้าน","Check their favorites before bringing them home."],["สรุปคำสั่งซื้อ","สรุปคำสั่งซื้อ","Order Summary"],["ยอดรวม","ยอดรวม","Total"],
    ["เข้าสู่แก๊ง PAP","เข้าสู่แก๊ง PAP","Join the PAP pack"],["ชื่อเล่น","ชื่อเล่น","Nickname"],["เข้าสู่ระบบแบบ Demo","เข้าสู่ระบบแบบ Demo","Demo Login"],
    ["Shipping Address","ที่อยู่จัดส่ง","Shipping Address"],["Order Summary","สรุปรายการ","Order Summary"],["Place Order","ยืนยันคำสั่งซื้อ","Place Order"],["Total","ยอดรวม","Total"],
    ["Full Name","ชื่อ-นามสกุล","Full Name"],["Phone Number","เบอร์โทรศัพท์","Phone Number"],["Address","ที่อยู่","Address"],["Province","จังหวัด","Province"],["Postal Code","รหัสไปรษณีย์","Postal Code"],
    ["My Profile","โปรไฟล์ของฉัน","My Profile"],["My Orders","คำสั่งซื้อของฉัน","My Orders"],["Logout","ออกจากระบบ","Logout"],["Checkout","ชำระเงิน","Checkout"],
    ["All Products","สินค้าทั้งหมด","All Products"],["All Ages","ทุกช่วงวัย","All Ages"],["Search products","ค้นหาสินค้า","Search products"],["Reset Filters","ล้างตัวกรอง","Reset Filters"],
    ["Not in cart","ยังไม่อยู่ในตะกร้า","Not in cart"],["Out of Stock","สินค้าหมด","Out of Stock"],["Stock limit reached","ถึงจำนวนสต็อกสูงสุดแล้ว","Stock limit reached"],["Added to cart!","เพิ่มลงตะกร้าแล้ว!","Added to cart!"],
    ["วันนี้อยากวิเคราะห์ใคร?","วันนี้อยากวิเคราะห์ใคร?","Who would you like to analyze today?"],["🐱 น้องแมว","🐱 น้องแมว","🐱 Cat"],["🐶 น้องหมา","🐶 น้องหมา","🐶 Dog"],
    ["🍪 ให้อาหาร","🍪 ให้อาหาร","🍪 Feed"],["🤍 ลูบหัว","🤍 ลูบหัว","🤍 Pet"],["ส่ง","ส่ง","Send"],
    ["ช้อปความสุข","ช้อปความสุข","Shop Happiness"],["ของชิ้นเล็กที่สร้างโมเมนต์ใหญ่ให้สมาชิกขนฟู","ของชิ้นเล็กที่สร้างโมเมนต์ใหญ่ให้สมาชิกขนฟู","Small things that create big moments for furry family members."],
    ["รับข่าวดีจากแก๊ง PAP","รับข่าวดีจากแก๊ง PAP","Good news from the PAP pack"],["ของใหม่ โปรลับ และเรื่องน่ารักส่งตรงถึงหน้าจอ","ของใหม่ โปรลับ และเรื่องน่ารักส่งตรงถึงหน้าจอ","New arrivals, secret deals, and cute stories delivered to your screen."],["เข้าร่วมแก๊ง","เข้าร่วมแก๊ง","Join the Pack"],
    ["Demo Login เท่านั้น — ไม่มีการยืนยันตัวตนและไม่ควรใช้กับข้อมูลจริง","Demo Login เท่านั้น — ไม่มีการยืนยันตัวตนและไม่ควรใช้กับข้อมูลจริง","Demo login only — no identity verification; do not use real personal data."],["อีเมล","อีเมล","Email"],["เช่น มะลิ","เช่น มะลิ","e.g. Mali"],
    ["ตรวจข้อมูลจัดส่งและรายการสินค้าก่อนยืนยัน","ตรวจข้อมูลจัดส่งและรายการสินค้าก่อนยืนยัน","Review your shipping details and items before confirming."],["Shipping & Order","การจัดส่งและคำสั่งซื้อ","Shipping & Order"],["District / Area","เขต / อำเภอ","District / Area"],["ดูทั้งหมด →","ดูทั้งหมด →","View All →"]
  ];
  const lookup = new Map(); textPairs.forEach(([source, th, en]) => { lookup.set(source, { th, en }); lookup.set(th, { th, en }); lookup.set(en, { th, en }); });
  const t = (key, params = {}) => { const pair = messages[key]; let value = pair ? pair[language === "en" ? 1 : 0] : key; Object.entries(params).forEach(([name, replacement]) => { value = value.replace(`{${name}}`, replacement); }); return value; };
  const translateText = (node) => { if (node.parentElement?.closest("[data-no-i18n],script,style")) return; const trimmed = node.nodeValue.trim(); const pair = lookup.get(trimmed); if (!pair) return; node.nodeValue = node.nodeValue.replace(trimmed, pair[language]); };
  const translate = (scope = document.body) => {
    if (!scope) return;
    const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT); while (walker.nextNode()) translateText(walker.currentNode);
    scope.querySelectorAll?.("[placeholder],[aria-label],[title]").forEach((element) => ["placeholder","aria-label","title"].forEach((attribute) => { const value = element.getAttribute(attribute); const pair = lookup.get(value); if (pair) element.setAttribute(attribute, pair[language]); }));
  };
  let audioContext; let lastSoundAt = 0;
  const soundOn = () => { try { return localStorage.getItem("pap-sound") === "on"; } catch { return false; } };
  const sound = (type = "click", species = pet) => {
    if (!soundOn()) return false;
    const now = performance.now(); if (now - lastSoundAt < 90) return false; lastSoundAt = now;
    const Engine = window.AudioContext || window.webkitAudioContext; if (!Engine) return false;
    audioContext ||= new Engine(); if (audioContext.state === "suspended") audioContext.resume();
    const sets = { cart:[420,620], success:[523,659,784], mood:[392,523,659], chaos:[220,330,440], feed:species === "cat" ? [680,820] : [360,520], pet:species === "cat" ? [420,500] : [520,660], click:[480] };
    (sets[type] || sets.click).forEach((frequency, index) => { const oscillator=audioContext.createOscillator(), gain=audioContext.createGain(); oscillator.type=type === "chaos" ? "triangle" : "sine"; oscillator.frequency.value=frequency; const start=audioContext.currentTime+index*.055; gain.gain.setValueAtTime(.0001,start); gain.gain.exponentialRampToValueAtTime(.045,start+.01); gain.gain.exponentialRampToValueAtTime(.0001,start+.11); oscillator.connect(gain).connect(audioContext.destination); oscillator.start(start); oscillator.stop(start+.12); });
    return true;
  };
  const applyControls = () => {
    if (location.pathname.endsWith("/admin.html")) return;
    const actions = document.querySelector(".nav-actions") || (() => { const shell=document.createElement("div"); shell.className="landing-preferences"; document.body.append(shell); return shell; })();
    let themeButton = actions.querySelector("[data-theme-toggle]"); if (!themeButton) { themeButton=document.createElement("button"); themeButton.type="button"; themeButton.className="theme-switch"; themeButton.dataset.themeToggle=""; actions.prepend(themeButton); }
    const updateTheme = () => { const dark=root.dataset.theme === "dark"; themeButton.textContent=dark?"☀":"☾"; themeButton.setAttribute("aria-label",t(dark?"light":"dark")); };
    themeButton.addEventListener("click",()=>{const next=root.dataset.theme === "dark"?"light":"dark";root.dataset.theme=next;try{localStorage.setItem("pap-theme",next)}catch{}updateTheme();}); updateTheme();
    if (!actions.querySelector(".language-toggle")) { const button=document.createElement("button"); button.type="button"; button.className="language-toggle"; button.textContent=language === "th"?"EN":"TH"; button.setAttribute("aria-label",language === "th"?"Switch to English":"เปลี่ยนเป็นภาษาไทย"); button.addEventListener("click",()=>{try{localStorage.setItem("pap-language",language === "th"?"en":"th")}catch{}location.reload();}); actions.prepend(button); }
    if (!actions.querySelector(".sound-toggle")) { const button=document.createElement("button"); button.type="button"; button.className="sound-toggle"; button.id="sound-toggle"; const update=()=>{const on=soundOn();button.textContent=on?"🔊":"🔇";button.setAttribute("aria-label",t(on?"soundOn":"soundOff"));}; button.addEventListener("click",()=>{try{localStorage.setItem("pap-sound",soundOn()?"off":"on")}catch{}update();if(soundOn())sound("click");}); update(); actions.prepend(button); }
  };
  document.addEventListener("DOMContentLoaded", () => { applyControls(); translate(); const observer=new MutationObserver((records)=>records.forEach((record)=>record.addedNodes.forEach((node)=>{if(node.nodeType===Node.TEXT_NODE)translateText(node);else if(node.nodeType===Node.ELEMENT_NODE)translate(node)}))); observer.observe(document.body,{childList:true,subtree:true}); addEventListener("pagehide",()=>observer.disconnect(),{once:true}); clearTimeout(failSafe); reveal(); });
  window.PAPUI = { t, translate, sound, soundOn, language, theme };
})();
