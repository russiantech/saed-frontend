import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../lib/api.js";

export default function PaymentCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState("Verifying your payment...");

  useEffect(() => {
    const reference = searchParams.get("reference");
    const type = searchParams.get("type") || "course";

    if (!reference) {
      setMessage("No payment reference was supplied.");
      return;
    }

    const verifyPayment = async () => {
      try {
        if (type === "trainer") {
          const data = await api("/paystack/initialize/", { method: "POST", body: {} });
          setMessage("Payment verified. Redirecting...");
          setTimeout(() => navigate("/app/dashboard", { replace: true }), 1200);
        } else {
          await api("/courses/pay/verify/", { method: "POST", body: { reference } });
          setMessage("Payment verified. Waiting for trainer confirmation...");
          setTimeout(() => navigate("/app/trainee-fast-track", { replace: true }), 1200);
        }
      } catch (err) {
        setMessage(err.message || "Payment could not be verified.");
      }
    };

    verifyPayment();
  }, [navigate, searchParams]);

  return (
    <section className="inactive-account-page">
      <div className="inactive-account-card">
        <h2>Payment Verification</h2>
        <p>{message}</p>
      </div>
    </section>
  );
}
