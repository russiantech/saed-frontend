import { ShieldAlert, CreditCard, X, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import { api } from "../lib/api.js";

export default function InactiveAccountPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [paying, setPaying] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("");

  const needsSaedApproval = user && !user.isAuthorized;
  const needsDunisActivation = user && !user.isActive;
  const onlyOneMessage = (needsSaedApproval && !needsDunisActivation) || (!needsSaedApproval && needsDunisActivation);

  useEffect(() => {
    if (user && user.isAuthorized && user.isActive) {
      navigate("/app", { replace: true });
    }
  }, [user, navigate]);

  function showMsg(text, type) {
    setMsg(text);
    setMsgType(type || "");
  }

  async function handlePay() {
    setPaying(true);
    showMsg("");
    try {
      const data = await api("/paystack/initialize/", {
        method: "POST",
        body: { email: user.email, amount: 50000 },
      });
      showMsg(`Payment reference: ${data.reference}. Complete payment to activate your account.`, "success");
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

        {needsSaedApproval && (
          <div className={`inactive-message-box${onlyOneMessage ? " inactive-message-box--centered" : ""}`}>
            <p>
              Your account has not been approved by SAED admin. If you have any questions,{" "}
              <Link to="/saed-question" className="link-button">click here</Link>.
            </p>
          </div>
        )}

        {needsDunisActivation && (
          <div className={`inactive-message-box${onlyOneMessage ? " inactive-message-box--centered" : ""}`}>
            <p>
              To activate your account, click the button below to make payment.
            </p>
            <button className="primary-button pay-button" disabled={paying} onClick={handlePay}>
              <CreditCard size={16} /> {paying ? "Initializing..." : "Make Payment"}
            </button>
            <p className="inactive-small-print">
              If you have made payment,{" "}
              <Link to="/dunis-complaint" className="link-button">click here</Link>.
            </p>
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
