import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../lib/auth.jsx";

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/admin", { replace: true });
      return;
    }
    if (user.role === "saed_admin") {
      navigate("/app/users", { replace: true });
    } else if (user.role === "dunis_admin") {
      navigate("/app/dunis-admin", { replace: true });
    } else {
      navigate("/app", { replace: true });
    }
  }, [user, navigate]);

  return <div className="empty-state">Redirecting to dashboard...</div>;
}
