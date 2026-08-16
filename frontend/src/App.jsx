import { NavLink, Outlet } from "react-router-dom";

export default function App() {
  return (
    <div className="migration-shell">
      <header>
        <strong>PAP Migration</strong>
        <nav aria-label="Migration scaffold">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/health">Health</NavLink>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
