import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import { Link } from "react-router-dom";
import BrandLogo from "../ui/BrandLogo.jsx";
import DarkToggle from "../ui/DarkToggle.jsx";

export default function FloatingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth > 680 && mobileOpen) setMobileOpen(false);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [mobileOpen]);

  return (
    <header className="floating-nav">
      <Link to="/" className="mini-logo" aria-label="NYSC SAED home">
        <BrandLogo size={42} />
      </Link>
      <nav>
        <Link to="/activities">Camp Activities</Link>
        <Link to="/signup/in-camp">In-Camp</Link>
        <Link to="/opportunities">Opportunities</Link>
      </nav>
      <div className="nav-actions">
        <DarkToggle />
        <Link className="nav-button" to="/login">Start SAED</Link>
        <button
          className="icon-only"
          aria-label="Open navigation"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          <Menu size={20} />
        </button>
      </div>

      <div className={`mobile-nav ${mobileOpen ? "open" : ""}`} role="menu">
        <Link role="menuitem" to="/activities" onClick={() => setMobileOpen(false)}>
          Camp Activities
        </Link>
        <Link role="menuitem" to="/signup/in-camp" onClick={() => setMobileOpen(false)}>
          In-Camp
        </Link>
        <Link role="menuitem" to="/opportunities" onClick={() => setMobileOpen(false)}>
          Opportunities
        </Link>
      </div>
    </header>
  );
}
