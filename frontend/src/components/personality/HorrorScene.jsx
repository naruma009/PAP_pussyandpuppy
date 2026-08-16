import { useEffect, useRef, useState } from "react";

export default function HorrorScene({ reducedMotion, onCancelNavigation }) {
  const [phase, setPhase] = useState("entering");
  const pupilsRef = useRef([]);
  useEffect(() => {
    const drain = window.setTimeout(() => setPhase("drain"), 450);
    const fade = window.setTimeout(() => setPhase("fade"), 1450);
    const final = window.setTimeout(() => setPhase("final"), 2400);
    return () => { clearTimeout(drain); clearTimeout(fade); clearTimeout(final); };
  }, []);
  useEffect(() => {
    if (phase !== "final" || reducedMotion) return undefined;
    let frame = 0; let targetX = innerWidth / 2; let targetY = innerHeight / 2; let currentX = targetX; let currentY = targetY;
    const move = (event) => { targetX = event.clientX; targetY = event.clientY; };
    const animate = () => {
      currentX += (targetX - currentX) * .12; currentY += (targetY - currentY) * .12;
      pupilsRef.current.forEach((pupil) => { const eye = pupil?.parentElement?.getBoundingClientRect(); if (!eye) return; const angle = Math.atan2(currentY - (eye.top + eye.height / 2), currentX - (eye.left + eye.width / 2)); const distance = Math.min(eye.width * .17, Math.hypot(currentX - eye.left, currentY - eye.top) * .035); pupil.style.transform = `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`; });
      frame = requestAnimationFrame(animate);
    };
    addEventListener("pointermove", move); frame = requestAnimationFrame(animate);
    return () => { removeEventListener("pointermove", move); cancelAnimationFrame(frame); };
  }, [phase, reducedMotion]);
  return <main className={`horror-scene horror-scene--${phase}`} aria-label="Something is missing">
    {phase === "final" && <><div className="crt-noise" aria-hidden="true" />{["one", "two", "three"].map((name, index) => <div key={name} className={`eye eye-${name}`} aria-hidden="true"><span ref={(node) => { pupilsRef.current[index] = node; }} className="pupil" /></div>)}<h1>Something is missing...</h1><p>SIGNAL LOST // SUBJECT DETECTED</p></>}
  </main>;
}
