document.addEventListener("DOMContentLoaded", () => {
  const store = window.PAPStore;
  const horrorStyles = document.createElement("link"); horrorStyles.rel = "stylesheet"; horrorStyles.href = "css/horror-scene.css"; document.head.append(horrorStyles);
  const playSound = (type = "click", species = store.getMode()) => window.PAPUI?.sound(type, species);
  document.querySelectorAll("[data-mode]").forEach((card) => card.addEventListener("click", () => {
    const mode = card.dataset.mode; store.setMode(mode); playSound("click", mode);
    card.classList.add("chosen"); document.body.classList.add("leaving");
    setTimeout(() => { location.href = "home.html"; }, 850);
  }));
  document.querySelector("#secret-button").addEventListener("click", enterHorrorMode, { once: true });

  function enterHorrorMode() {
    playSound("chaos");
    document.body.classList.add("entering-horror");
    setTimeout(() => document.body.classList.add("horror-drain"), 450);
    setTimeout(() => document.body.classList.add("horror-fade"), 1450);
    setTimeout(renderHorrorScene, 2400);
  }

  function renderHorrorScene() {
    document.body.className = "horror-scene";
    document.body.innerHTML = `<main class="void" aria-label="Something is missing">
      <div class="crt-noise" aria-hidden="true"></div>
      <div class="eye eye-one" aria-hidden="true"><span class="pupil"></span></div>
      <div class="eye eye-two" aria-hidden="true"><span class="pupil"></span></div>
      <div class="eye eye-three" aria-hidden="true"><span class="pupil"></span></div>
      <h1>Something is missing...</h1><p>SIGNAL LOST // SUBJECT DETECTED</p>
    </main>`;
    trackEyes();
  }

  function trackEyes() {
    const pupils = [...document.querySelectorAll(".pupil")];
    let targetX = innerWidth / 2, targetY = innerHeight / 2, currentX = targetX, currentY = targetY;
    addEventListener("pointermove", (event) => { targetX = event.clientX; targetY = event.clientY; });
    function animate() {
      currentX += (targetX - currentX) * 0.12; currentY += (targetY - currentY) * 0.12;
      pupils.forEach((pupil) => {
        const eye = pupil.parentElement.getBoundingClientRect();
        const angle = Math.atan2(currentY - (eye.top + eye.height / 2), currentX - (eye.left + eye.width / 2));
        const distance = Math.min(eye.width * 0.17, Math.hypot(currentX - eye.left, currentY - eye.top) * 0.035);
        pupil.style.transform = `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`;
      });
      requestAnimationFrame(animate);
    }
    animate();
  }
});
