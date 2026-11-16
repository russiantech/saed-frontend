import { ShieldAlert, CreditCard, X, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/auth.jsx";
import { payFlow, naira } from "../../lib/payments.js";
import { api } from "../../lib/api.js";

export default function InactiveAccountPage() {
  const { user, logout, refreshUser } = useAuth();
  const [fee, setFee] = useState(null);
  const navigate = useNavigate();
  const [paying, setPaying] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("");

  const needsSaedApproval = user && !user.isAuthorized;
  const needsDunisActivation = user && !user.isActive;

  useEffect(() => {
    if (user && user.isAuthorized && user.isActive) {
      navigate("/app/dashboard", { replace: true });
    }
  }, [user, navigate]);

  function showMsg(text, type) {
    setMsg(text);
    setMsgType(type || "");
  }

  useEffect(() => {
    api("/payments/config/").then((c) => setFee(c.trainerActivationFeeKobo / 100)).catch(() => {});
  }, []);

  async function handlePay() {
    setPaying(true);
    showMsg("");
    try {
      const r = await payFlow("/payments/trainer-activation/");
      if (r.status === "success") {
        await refreshUser();
        navigate("/app/dashboard", { replace: true });
      } else if (r.status === "mismatch") showMsg("Your payment is under review. You have not lost your money; your account will be activated once it is confirmed.", "warning");
      else if (r.status === "pending") showMsg("Your payment is still processing. Activation happens automatically once your bank confirms.", "warning");
      else if (r.status === "closed") showMsg("Payment window closed. No money was taken.", "warning");
      else showMsg(r.message || "Payment was not completed. No money was taken.", "error");
    } catch (err) {
      showMsg(err.message, "error");
    } finally {
      setPaying(false);
    }
  }

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // ignore
    }
    navigate("/login", { replace: true });
  }

  if (!user) return null;

  return (
    <section className="inactive-account-page">
      <div className="inactive-account-card">
        <div className="inactive-account-icon">
          <ShieldAlert size={48} />
        </div>
        <h2>Account Inactive</h2>

        {(needsSaedApproval || needsDunisActivation) && (
          <div className="inactive-message-box">
            <p>
              Click the button below to pay for activation and continue as a trainer.
            </p>
            <button className="primary-button pay-button" disabled={paying} onClick={handlePay}>
              <CreditCard size={16} /> {paying ? "Opening Paystack..." : fee ? `Pay ${naira(fee)} to Activate` : "Pay to Activate"}
            </button>
          </div>
        )}

        {msg && (
          <div className={`inline-message inline-message--${msgType || "error"}`} style={{ marginTop: 12 }}>
            {msg}
            <button type="button" className="inline-message-close" onClick={() => showMsg("")}><X size={16} /></button>
          </div>
        )}

        <div className="inactive-account-actions">
          <button type="button" className="outline-button" onClick={handleLogout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>
    </section>
  );
}
