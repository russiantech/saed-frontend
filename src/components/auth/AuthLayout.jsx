import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import DarkToggle from "components/ui/DarkToggle.jsx";
import BrandLogo from "components/ui/BrandLogo.jsx";

export default function AuthLayout({ children, title, subtitle, onBack }) {
  const navigate = useNavigate();
  return (
    <main className="auth-page full-width">
      <div className="auth-top">
        <DarkToggle />
      </div>
      <div className="auth-panel">
        <button type="button" className="back-link" onClick={onBack || (() => navigate(-1))}>
          <ArrowLeft size={16} /> Back
        </button>
        <Link to="/" className="auth-brand" aria-label="NYSC SAED — go to home page"><BrandLogo size={64} /><span>NYSC SAED</span></Link>
        {title && <h1>{title}</h1>}
        {subtitle && <p>{subtitle}</p>}
        {children}
      </div>
    </main>
  );
  
}

