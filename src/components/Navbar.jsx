import { NavLink } from "react-router-dom";

function Navbar({ search, setSearch }) {
  return (
    <header className="navbar-shell">
      <nav className="navbar">
        <div className="brand-wrap">
          <div className="brand-mark">T</div>
          <span className="brand-name">TaskFlow</span>
        </div>
        <div className="nav-links" aria-label="Main navigation">
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/calendar">
            Calendar
          </NavLink>
        </div>

        <label className="searchbox" aria-label="Search tasks">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M10.5 3a7.5 7.5 0 015.95 12.8l4.35 4.35 1.4-1.4-4.35-4.35A7.5 7.5 0 1110.5 3zm0 2a5.5 5.5 0 100 11 5.5 5.5 0 000-11z" />
          </svg>
          <input
            type="search"
            placeholder="Search tasks"
            aria-label="Search tasks"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </nav>
    </header>
  );
}

export default Navbar;