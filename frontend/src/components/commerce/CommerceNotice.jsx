import { useCommerce } from "../../features/commerce/CommerceProvider";
export default function CommerceNotice() { const { notice } = useCommerce(); return notice ? <div className="toast" role="status">{notice}</div> : null; }
