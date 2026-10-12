import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { api } from "../../lib/api.js";

export default function CoursePaymentCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState("Verifying your payment...");

  useEffect(() => {
    const reference = searchParams.get("reference");
    if (!reference) {
      setMessage("No payment reference was supplied.");
      return;
    }

    api("/courses/pay/verify/", { method: "POST", body: { reference } })
      .then(() => {
        setMessage("Payment verified. Waiting for trainer confirmation...");
        setTimeout(() => navigate("/app/trainee-fast-track", { replace: true }), 1200);
      })
      .catch((err) => setMessage(err.message || "Payment could not be verified."));
  }, [navigate, searchParams]);

  return <div className="empty-state"><p>{message}</p></div>;
}
