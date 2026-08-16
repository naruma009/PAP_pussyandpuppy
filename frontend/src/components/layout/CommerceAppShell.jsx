import { Outlet } from "react-router-dom";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

export default function CommerceAppShell() {
  return (
    <div className="pap-app">
      <a className="skip-link" href="#main">Skip to content</a>
      <SiteHeader />
      <main id="main"><Outlet /></main>
      <SiteFooter />
    </div>
  );
}
