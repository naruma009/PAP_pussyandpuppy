import { useEffect, useRef, useState } from "react";
import { randomBetween } from "../../features/personality/personalityBehavior";

const emojiFor = (mode, index) => mode === "cat" ? "🐱" : mode === "dog" ? "🐶" : index % 2 ? "🐶" : "🐱";

export default function ChaosExperience({ controllers, mode, reducedMotion, playSound, random = Math.random }) {
  const [active, setActive] = useState(null);
  const generation = useRef(0);
  const cleanupRef = useRef(() => {});

  useEffect(() => () => { generation.current += 1; cleanupRef.current(); }, []);

  const stop = () => {
    const cleanup = cleanupRef.current;
    cleanupRef.current = () => {};
    cleanup();
    generation.current += 1;
    setActive(null);
  };

  const start = () => {
    if (active || controllers.some((controller) => controller.isLocked())) return;
    const locked = [];
    for (const controller of controllers) {
      if (!controller.beginInteraction("chaos")) {
        locked.forEach((item) => item.endInteraction("chaos"));
        return;
      }
      locked.push(controller);
    }
    const count = reducedMotion ? 4 : randomBetween(controllers.length === 1 ? 5 : 12, controllers.length === 1 ? 7 : 16, random);
    const id = ++generation.current;
    const timer = window.setTimeout(() => { if (generation.current === id) stop(); }, reducedMotion ? 3000 : 9500);
    let cleaned = false;
    cleanupRef.current = () => { if (cleaned) return; cleaned = true; clearTimeout(timer); locked.forEach((controller) => controller.endInteraction("chaos")); };
    setActive({ count, reduced:reducedMotion, id });
    playSound("chaos", mode);
  };

  return <div className="pap-chaos-experience">
    <button className="pap-chaos-trigger" type="button" aria-label="Secret" onClick={start}>✦</button>
    {active && <div className={`pap-chaos-stage${active.reduced ? " pap-chaos-stage--reduced" : ""}`} data-testid="chaos-stage" aria-hidden="true">
      {Array.from({ length:active.count }, (_, index) => <span key={index} className="pap-chaos-mascot" style={{ "--chaos-left": `${12 + index * (active.count === 4 ? 24 : 77 / Math.max(1, active.count - 1))}%`, "--chaos-delay": `${index * 55}ms` }}>{emojiFor(mode, index)}</span>)}
    </div>}
  </div>;
}
