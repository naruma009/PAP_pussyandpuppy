const GLYPHS = {
  cat: { face:"🐱", tail:"〰", label:"แมว PAP" },
  dog: { face:"🐶", tail:"⌁", label:"หมา PAP" }
};

export function createMascotVisual(kind) {
  const asset = GLYPHS[kind];
  const root = document.createElement("div");
  root.className = `pap-mascot pap-mascot--${kind}`;
  root.dataset.kind = kind;
  root.dataset.state = "idle";
  root.setAttribute("role", "img");
  root.setAttribute("aria-label", asset.label);
  root.innerHTML = `<span class="pap-mascot__shadow"></span><span class="pap-mascot__tail" aria-hidden="true">${asset.tail}</span><span class="pap-mascot__face" aria-hidden="true">${asset.face}</span>`;
  return { root, kind };
}

export function renderMascot(visual, model) {
  visual.root.dataset.state = model.state;
  visual.root.dataset.direction = model.direction;
  visual.root.style.setProperty("--mascot-x", `${Math.round(model.x)}px`);
  visual.root.style.setProperty("--mascot-y", `${Math.round(model.y)}px`);
  visual.root.style.setProperty("--mascot-duration", `${model.duration}ms`);
  visual.root.style.setProperty("--look-x", String(model.lookX));
  visual.root.style.setProperty("--look-y", String(model.lookY));
}

export function setMascotVisible(visual, visible) {
  visual.root.hidden = !visible;
}
