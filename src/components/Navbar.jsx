import "../style/Navbar.css";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">QuestList</div>
        <div className="navbar-links">
          <a href="/" className="navbar-link">
            Home
          </a>
          <a href="/todos" className="navbar-link">
            Todo
          </a>
          <a href="/about" className="navbar-link">
            About
          </a>
        </div>
      </div>
    </nav>
  );
}
