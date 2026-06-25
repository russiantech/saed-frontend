import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import DarkToggle from "components/ui/DarkToggle.jsx";

export default function AuthLayout({ children, title, subtitle }) {
  const navigate = useNavigate();
  return (
    <main className="auth-page full-width">
      <div className="auth-top">
        <DarkToggle />
      </div>
      <div className="auth-panel">
        <button type="button" className="back-link" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back
        </button>
        {title && <h1>{title}</h1>}
        {subtitle && <p>{subtitle}</p>}
        {children}
      </div>
    </main>
  );
  
}

