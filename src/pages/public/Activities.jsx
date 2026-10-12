import { Link } from "react-router-dom";
import CampActivities from "../../components/ui/CampActivities.jsx";
import FloatingNav from "../../components/layout/FloatingNav.jsx";

export default function Activities() {
  return (
    <div className="site-page">
      <FloatingNav />
      <Link className="back-link" to="/">← Back to Home</Link>
      <CampActivities />
    </div>
  );
}
