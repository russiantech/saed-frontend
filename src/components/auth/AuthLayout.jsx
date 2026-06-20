import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import DarkToggle from "components/DarkToggle.jsx";

export default function AuthLayout({ children, backLink = "/", title, subtitle }) {
  return (
    <main className="auth-page full-width">
      <div className="auth-top">
        <DarkToggle />
      </div>
      <div className="auth-panel">
        <Link className="back-link" to={backLink}>
          <ArrowLeft size={16} /> Back
        </Link>
        {title && <h1>{title}</h1>}
        {subtitle && <p>{subtitle}</p>}
        {children}
      </div>
    </main>
  );
  
}

