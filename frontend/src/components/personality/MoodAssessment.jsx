import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { moodResult, questionsFor, recommendedProducts } from "../../features/personality/personalityBehavior";
import { usePreferences } from "../../features/preferences/PreferenceProvider";

const TH_CATEGORIES = { Beds:"ที่นอน", Treats:"ขนม", Accessories:"อุปกรณ์", Toys:"ของเล่น" };

export default function MoodAssessment({ products, random = Math.random }) {
  const { language, petMode, playSound, t } = usePreferences();
  const [quiz, setQuiz] = useState(null);
  const triggerRef = useRef(null), dialogRef = useRef(null), focusFrameRef = useRef(0);
  const close = () => { setQuiz(null); focusFrameRef.current = requestAnimationFrame(() => { focusFrameRef.current = 0; triggerRef.current?.focus(); }); };
  useEffect(() => () => { if (focusFrameRef.current) cancelAnimationFrame(focusFrameRef.current); }, []);
  useEffect(() => {
    if (!quiz) return undefined;
    dialogRef.current?.querySelector("button")?.focus();
    const keydown = (event) => { if (event.key === "Escape") close(); };
    document.addEventListener("keydown", keydown);
    return () => document.removeEventListener("keydown", keydown);
  }, [quiz]);
  const start = (species, snapshot = products) => setQuiz({ species, products:[...snapshot], questions:questionsFor(species, language, random), step:0, answers:[], result:null });
  const open = () => petMode === "both" ? setQuiz({ species:null, products:[...products], questions:[], step:0, answers:[], result:null }) : start(petMode);
  const answer = (selected) => {
    const answers = [...quiz.answers, selected];
    if (answers.length < quiz.questions.length) { setQuiz({ ...quiz, answers, step:quiz.step + 1 }); return; }
    const result = moodResult(quiz.species, answers, random);
    setQuiz({ ...quiz, answers, result });
    playSound("mood", quiz.species);
  };
  const chooseSpecies = (species) => start(species, quiz.products);
  const resultProducts = quiz?.result ? recommendedProducts(quiz.products, quiz.species, quiz.result.categories) : [];
  const categoryNames = quiz?.result?.categories.map((category) => language === "en" ? category : TH_CATEGORIES[category] || category) || [];

  return <>
    <button ref={triggerRef} className="button" type="button" onClick={open}>{t("personalityMoodCta")}</button>
    {quiz && <div className="pap-mood-overlay" onPointerDown={(event) => { if (event.target === event.currentTarget) close(); }}><section ref={dialogRef} className={`pap-mood-card${quiz.result ? " pap-mood-result" : quiz.species ? "" : " pap-mood-species"}`} role="dialog" aria-modal="true" aria-labelledby="pap-mood-title">
      <button className="pap-mood-close" type="button" aria-label={t("personalityClose")} onClick={close}>×</button>
      {!quiz.species && <><span>PAP Mood Check</span><h2 id="pap-mood-title">{t("personalityMoodWho")}</h2><div className="pap-mood-options"><button type="button" onClick={() => chooseSpecies("cat")}>{t("personalityCatPet")}</button><button type="button" onClick={() => chooseSpecies("dog")}>{t("personalityDogPet")}</button></div></>}
      {quiz.species && !quiz.result && <><span>{t("personalityQuestion")} {quiz.step + 1} / {quiz.questions.length}</span><h2 id="pap-mood-title">{quiz.questions[quiz.step].text}</h2><div className="pap-mood-options">{quiz.questions[quiz.step].answers.map((option, index) => <button key={`${option.mood}-${index}`} type="button" onClick={() => answer(option)}>{option.text}</button>)}</div></>}
      {quiz.result && <><span className="pap-mood-badge">{quiz.result.badge}</span><h2 id="pap-mood-title">{language === "en" ? quiz.result.enTitle : quiz.result.title}</h2><p>{language === "en" ? quiz.result.enDescription : quiz.result.description}</p><div className="pap-mood-meter" aria-hidden="true"><i style={{ width:`${quiz.result.meter}%` }} /></div><strong>{t("personalityRecommend")} {categoryNames.join(" / ")}</strong><div className="pap-mood-products">{resultProducts.map((product) => <Link key={product.id} to={`/products/${product.id}`}>{product.emoji || "🐾"} {product.name}</Link>)}</div></>}
    </section></div>}
  </>;
}
