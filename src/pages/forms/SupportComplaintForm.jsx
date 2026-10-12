import { ArrowLeft, Send, X, Upload } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { api } from "../../lib/api.js";

export default function SupportComplaintForm({ defaultRecipient }) {
  const location = useLocation();
  const inferredRecipient = defaultRecipient || (location.pathname.includes("dunis") ? "dunis_admin" : "saed_admin");
  const isDunis = inferredRecipient === "dunis_admin";

  const [recipient, setRecipient] = useState(inferredRecipient);
  const [subject, setSubject] = useState(isDunis ? "Payment issue" : "Account approval status");
  const [message, setMessage] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState("");
  const [resultType, setResultType] = useState("");

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const data = await api("/media/upload/", { method: "POST", body: formData });
      setAttachmentUrl(data.url);
    } catch (err) {
      setResult(err.message || "Upload failed.");
      setResultType("error");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSending(true);
    setResult("");
    try {
      await api("/submit-complaint/", {
        method: "POST",
        body: {
          subject,
          message,
          recipient,
          attachmentUrl,
        },
      });
      setResult(
        recipient === "dunis_admin"
          ? "Your complaint has been submitted. A Dunis admin will review it shortly."
          : "Your question has been submitted. A SAED admin will review it shortly."
      );
      setResultType("success");
      setMessage("");
      setAttachmentUrl("");
    } catch (err) {
      setResult(err.message || "Failed to submit request.");
      setResultType("error");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="inactive-account-page">
      <div className="inactive-account-card">
        <Link className="back-link" to="/app/inactive-account"><ArrowLeft size={16} /> Back</Link>
        <h2>{recipient === "dunis_admin" ? "Payment & Technical Support" : "Ask SAED Admin"}</h2>
        <p>
          {recipient === "dunis_admin"
            ? "Submit a question or complaint regarding payment or technical issues."
            : "Submit a question or inquiry about your account approval or program moderation."}
        </p>

        {result && (
          <div className={`inline-message inline-message--${resultType || "error"}`} style={{ marginBottom: 16 }}>
            {result}
            <button type="button" className="inline-message-close" onClick={() => setResult("")}><X size={16} /></button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label>Department / Admin
            <select
              value={recipient}
              onChange={(e) => {
                setRecipient(e.target.value);
                setSubject(e.target.value === "dunis_admin" ? "Payment issue" : "Account approval status");
              }}
            >
              <option value="saed_admin">SAED Admin (Approvals & Programs)</option>
              <option value="dunis_admin">Dunis Admin (Payments & Verification)</option>
            </select>
          </label>

          <label>Subject
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Payment inquiry or account status"
              required
            />
          </label>

          <label>Message *
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your inquiry or issue in detail..."
              rows={5}
              required
            />
          </label>

          <div>
            <span style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Attachment (optional)</span>
            <div className="file-upload-input">
              <input type="file" id="support-complaint-file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt" onChange={handleFileUpload} disabled={uploading} />
              <label htmlFor="support-complaint-file" className="file-upload-label">
                <Upload size={14} /> {uploading ? "Uploading..." : "Choose File"}
              </label>
              {attachmentUrl && !uploading && <span className="file-upload-name">{attachmentUrl.split("/").pop()}</span>}
            </div>
          </div>

          <button className="primary-button" type="submit" disabled={sending} style={{ width: "100%", marginTop: 8 }}>
            <Send size={16} /> {sending ? "Sending..." : "Submit Inquiry"}
          </button>
        </form>
      </div>
    </section>
  );
}
