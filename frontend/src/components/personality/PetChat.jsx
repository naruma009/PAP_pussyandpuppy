import { useEffect, useRef, useState } from "react";
import { CHAT_REPLIES } from "../../features/personality/personalityData";
import { randomBetween } from "../../features/personality/personalityBehavior";
import { randomItem } from "../../features/personality/mascotBehavior";
import { usePreferences } from "../../features/preferences/PreferenceProvider";

export default function PetChat({ getControllers, mode, random = Math.random }) {
  const { language, t } = usePreferences();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [messages, setMessages] = useState([]);
  const inputRef = useRef(null), launcherRef = useRef(null), timerRef = useRef(0), responderRef = useRef(null), openRef = useRef(false), aliveRef = useRef(true);
  useEffect(() => { openRef.current = open; if (open) inputRef.current?.focus(); }, [open]);
  useEffect(() => { aliveRef.current = true; return () => { aliveRef.current = false; clearTimeout(timerRef.current); responderRef.current?.endInteraction("chat"); }; }, []);
  useEffect(() => {
    if (!open) return undefined;
    const escape = (event) => { if (event.key === "Escape") { setOpen(false); launcherRef.current?.focus(); } };
    document.addEventListener("keydown", escape); return () => document.removeEventListener("keydown", escape);
  }, [open]);

  const submit = (event) => {
    event.preventDefault();
    const text = inputRef.current.value.trim();
    if (!text || pending) return;
    const available = getControllers().filter((controller) => !controller.isLocked());
    if (!available.length) return;
    const responder = mode === "both" ? randomItem(available, random) : available.find((controller) => controller.kind === mode);
    if (!responder?.pauseForResponse()) return;
    responderRef.current = responder;
    inputRef.current.value = "";
    setPending(true);
    const id = `${Date.now()}-${random()}`;
    setMessages((current) => [...current, { id:`${id}-user`, side:"user", text }, { id:`${id}-pet`, side:"pet", kind:responder.kind, typing:true }]);
    timerRef.current = window.setTimeout(() => {
      if (!aliveRef.current || responderRef.current !== responder) return;
      const response = randomItem(CHAT_REPLIES[language][responder.kind], random);
      setMessages((current) => current.map((message) => message.id === `${id}-pet` ? { ...message, typing:false, text:response } : message));
      responder.reactAndResume();
      responderRef.current = null;
      setPending(false);
      if (openRef.current) inputRef.current?.focus();
    }, randomBetween(300, 900, random));
  };

  return <div className="pap-pet-chat">
    <button ref={launcherRef} className="pap-chat-launcher" type="button" aria-expanded={open} aria-controls="pap-chat-panel" onClick={() => setOpen((value) => !value)}>🐾 <span>{t("personalityChatAsk")}</span></button>
    {open && <section id="pap-chat-panel" className="pap-chat-panel" aria-label="PAP Pet Chat"><header><div><strong>PAP Pet Chat</strong><small>{t("personalityChatNote")}</small></div><button className="pap-chat-close" type="button" aria-label={t("personalityClose")} onClick={() => { setOpen(false); launcherRef.current?.focus(); }}>×</button></header>
      <div className="pap-chat-messages" aria-live="polite">{messages.map((message) => <div key={message.id} className={`pap-chat-message pap-chat-message--${message.side}${message.typing ? " pap-chat-message--typing" : message.side === "pet" ? " pap-chat-message--reply" : ""}`} data-kind={message.kind || undefined}>{message.side === "pet" && <span className="pap-chat-avatar" aria-hidden="true">{message.kind === "cat" ? "🐱" : "🐶"}</span>}{message.typing ? <span className="pap-typing-dots" aria-label={t("personalityTyping")}><i /><i /><i /></span> : <span>{message.text}</span>}</div>)}</div>
      <form onSubmit={submit}><label className="sr-only" htmlFor="pap-chat-input">{t("personalityChatMessage")}</label><input ref={inputRef} id="pap-chat-input" maxLength="180" autoComplete="off" placeholder={t("personalityChatPlaceholder")} disabled={pending} /><button type="submit">{t("personalitySend")}</button></form>
    </section>}
  </div>;
}
