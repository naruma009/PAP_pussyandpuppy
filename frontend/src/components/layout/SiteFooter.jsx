import { Link } from "react-router-dom";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <Link className="logo" to="/home"><span className="logo-mark">P</span>PAP</Link>
        <span>Pussy &amp; Puppy © 2026</span>
      </div>
    </footer>
  );
}
