import { ShieldAlert, CreditCard, X, LogOut, Clock, CheckCircle2, AlertOctagon, HelpCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../lib/auth.jsx";
import { api } from "../../lib/api.js";

export default function InactiveAccountPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [paying, setPaying] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("");

  const isDeclined = user && (user.authorizationStatus === "declined" || user.authorizationStatus === "removed");
  const isApproved = user && user.isAuthorized;

  useEffect(() => {
    if (user && user.isAuthorized && user.isActive && user.hasPaid) {
      navigate("/app/dashboard", { replace: true });
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
        body: { email: user.email, amount: Number(process.env.REACT_APP_PAYSTACK_DEFAULT_AMOUNT) || 50000 },
      });
      window.location.assign(data.authorization_url);
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
        {isDeclined ? (
          <>
            <div className="inactive-account-icon inactive-account-icon--danger">
              <AlertOctagon size={44} />
            </div>
            <h2>Application Not Approved</h2>
            <div className="inactive-message-box inactive-message-box--danger">
              <p>
                Your trainer application could not be approved by the SAED administration at this time.
              </p>
              <p className="inactive-small-print">
                If you believe this is an error or would like to submit updated credentials or a new partnership letter, please contact support.
              </p>
            </div>
          </>
        ) : isApproved ? (
          <>
            <div className="inactive-account-icon inactive-account-icon--success">
              <CheckCircle2 size={44} />
            </div>
            <h2>Application Approved!</h2>
            <div className="inactive-message-box inactive-message-box--success">
              <p>
                <strong>Congratulations!</strong> Your trainer profile has been verified and approved by the NYSC SAED Administration.
              </p>
              <p style={{ marginTop: 8 }}>
                Please complete your annual <strong>₦5,000</strong> activation fee to unlock your trainer portal, create courses, and connect with corps members.
              </p>
              <button className="primary-button pay-button" disabled={paying} onClick={handlePay}>
                <CreditCard size={16} /> {paying ? "Connecting to Paystack..." : "Pay to Activate (₦5,000)"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="inactive-account-icon inactive-account-icon--warning">
              <Clock size={44} />
            </div>
            <h2>Application Under Review</h2>
            <div className="inactive-message-box inactive-message-box--warning">
              <p>
                Your trainer profile and partnership letter have been received and are currently under review by the NYSC SAED Administration.
              </p>
              <p className="inactive-small-print">
                Once approved, you will receive an approval email with instructions to log in and pay the annual ₦5,000 activation fee.
              </p>
            </div>
            {user && (
              <div className="trainer-application-summary" style={{ textAlign: "left", margin: "16px 0", padding: "16px", background: "var(--surface-sunken, #f8fbf9)", borderRadius: "8px", border: "1px solid var(--border-color, #e0e6e2)", fontSize: "13px" }}>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "13px", fontWeight: "700", color: "var(--brand, #0f6b45)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Submitted Information</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "8px" }}>
                  <div><strong>Name:</strong> {user.fullName || user.email}</div>
                  <div><strong>Email:</strong> {user.email}</div>
                  {user.companyName && <div><strong>Organization:</strong> {user.companyName}</div>}
                  {user.specialization && <div><strong>Skill Area:</strong> {user.specialization}</div>}
                  {user.phone && <div><strong>Phone:</strong> {user.phone}</div>}
                  {user.partnerLgas && user.partnerLgas.length > 0 && (
                    <div><strong>Partner LGAs:</strong> {Array.isArray(user.partnerLgas) ? user.partnerLgas.join(", ") : user.partnerLgas}</div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {msg && (
          <div className={`inline-message inline-message--${msgType || "error"}`} style={{ marginTop: 12 }}>
            {msg}
            <button type="button" className="inline-message-close" onClick={() => showMsg("")}><X size={16} /></button>
          </div>
        )}

        <div className="inactive-account-actions">
          <Link to="/support" className="outline-button">
            <HelpCircle size={16} /> Contact Support
          </Link>
          <button type="button" className="outline-button" onClick={handleLogout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>
    </section>
  );
}
