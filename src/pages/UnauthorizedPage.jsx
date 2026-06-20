import { ShieldAlert, CreditCard, Mail, CheckCircle, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import { api } from "../lib/api.js";

export default function UnauthorizedPage() {
  const { user } = useAuth();
  const [paying, setPaying] = useState(false);
  const [paymentMsg, setPaymentMsg] = useState("");
  const [messageType, setMessageType] = useState("");
  const [showComplaint, setShowComplaint] = useState(false);
  const [complaintSubject, setComplaintSubject] = useState("");
  const [complaintMessage, setComplaintMessage] = useState("");
  const [complaintSending, setComplaintSending] = useState(false);

  function showMsg(text, type) {
    setPaymentMsg(text);
    setMessageType(type || "");
  }

  const hasPaid = user?.hasPaid && user?.paymentVerified;

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

  async function handleComplaint(e) {
    e.preventDefault();
    setComplaintSending(true);
    try {
      await api("/submit-complaint/", {
        method: "POST",
        body: { subject: complaintSubject, message: complaintMessage },
      });
      showMsg("Complaint submitted. An admin will review it shortly.", "success");
      setShowComplaint(false);
      setComplaintSubject("");
      setComplaintMessage("");
    } catch (err) {
      showMsg(err.message, "error");
    } finally {
      setComplaintSending(false);
    }
  }

  if (showComplaint) {
    return (
      <section className="unauthorized-page">
        <div className="unauthorized-card">
          <h2>Submit a Complaint</h2>
          <p>If you have already made payment but are still seeing this message, please submit a complaint below.</p>
          <form onSubmit={handleComplaint}>
            <label>Subject
              <input value={complaintSubject} onChange={(e) => setComplaintSubject(e.target.value)} placeholder="e.g. Payment already made" required />
            </label>
            <label>Message
              <textarea value={complaintMessage} onChange={(e) => setComplaintMessage(e.target.value)} placeholder="Describe your issue..." rows={4} required />
            </label>
            <div className="form-actions-row">
              <button type="button" className="outline-button" onClick={() => setShowComplaint(false)}>Cancel</button>
              <button type="submit" className="primary-button" disabled={complaintSending}>
                {complaintSending ? "Sending..." : "Submit Complaint"}
              </button>
            </div>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="unauthorized-page">
      <div className="unauthorized-card">
        <div className="unauthorized-icon">
          <ShieldAlert size={48} />
        </div>
        <h2>Account Pending Activation</h2>

        {hasPaid ? (
          <p>Your account has been activated. You now have full access to the platform.</p>
        ) : (
          <>
            <p>
              To activate your account, click the button below to make payment.
            </p>

            <button className="primary-button pay-button" disabled={paying} onClick={handlePay}>
              <CreditCard size={16} /> {paying ? "Initializing..." : "Make Payment (₦50,000)"}
            </button>

            <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 12 }}>
              If you have made payment but you're still seeing this message,{" "}
              <button type="button" className="link-button" onClick={() => setShowComplaint(true)}>
                click here
              </button>.
            </p>
          </>
        )}

        {paymentMsg && (
          <div className={`inline-message inline-message--${messageType || "error"}`} style={{ marginTop: 12 }}>
            {paymentMsg}
            <button type="button" className="inline-message-close" onClick={() => showMsg("")}><X size={16} /></button>
          </div>
        )}

        <div className="unauthorized-contact">
          <Mail size={16} />
          <span>Contact your administrator for payment assistance.</span>
        </div>
      </div>
    </section>
  );
}
