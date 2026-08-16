import { forwardRef } from "react";
const visuals = { cat:{ face:"🐱", tail:"〰", label:{ th:"แมว PAP", en:"PAP cat" } }, dog:{ face:"🐶", tail:"⌁", label:{ th:"หมา PAP", en:"PAP dog" } } };
const Mascot = forwardRef(function Mascot({ kind, language }, ref) { const visual = visuals[kind]; return <div ref={ref} className={`pap-mascot pap-mascot--${kind}`} data-kind={kind} data-state="idle" role="img" aria-label={visual.label[language]}><span className="pap-mascot__shadow" aria-hidden="true" /><span className="pap-mascot__tail" aria-hidden="true">{visual.tail}</span><span className="pap-mascot__face" aria-hidden="true">{visual.face}</span></div>; });
export default Mascot;
