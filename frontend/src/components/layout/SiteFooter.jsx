import { Link } from "react-router-dom";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
      <Link className="logo" to="/home"><span className="logo-mark">P</span>pal2paw</Link>
      <span>pal2paw © 2026</span>
      </div>
    </footer>
  );
}
