import { ArrowLeft, Send, X, Upload } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api.js";

export default function SaedQuestionForm() {
  const [subject, setSubject] = useState("");
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
          subject: subject || "Question about account approval",
          message,
          recipient: "saed_admin",
          attachmentUrl,
        },
      });
      setResult("Your question has been submitted. A SAED admin will review it shortly.");
      setResultType("success");
      setSubject("");
      setMessage("");
      setAttachmentUrl("");
    } catch (err) {
      setResult(err.message);
      setResultType("error");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="inactive-account-page">
      <div className="inactive-account-card">
        <Link className="back-link" to="/app/inactive-account"><ArrowLeft size={16} /> Back</Link>
        <h2>Ask SAED Admin</h2>
        <p>Submit a question or concern about your account approval.</p>

        {result && (
          <div className={`inline-message inline-message--${resultType || "error"}`} style={{ marginBottom: 16 }}>
            {result}
            <button type="button" className="inline-message-close" onClick={() => setResult("")}><X size={16} /></button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label>Subject
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Account approval status"
            />
          </label>
          <label>Message *
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your question or concern..."
              rows={5}
              required
            />
          </label>
          <div>
            <span style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Attachment (optional)</span>
            <div className="file-upload-input">
              <input type="file" id="saed-complaint-file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt" onChange={handleFileUpload} disabled={uploading} />
              <label htmlFor="saed-complaint-file" className="file-upload-label">
                <Upload size={14} /> {uploading ? "Uploading..." : "Choose File"}
              </label>
              {attachmentUrl && !uploading && <span className="file-upload-name">{attachmentUrl.split("/").pop()}</span>}
            </div>
          </div>
          <button className="primary-button" type="submit" disabled={sending} style={{ width: "100%" }}>
            <Send size={16} /> {sending ? "Sending..." : "Submit Question"}
          </button>
        </form>
      </div>
    </section>
  );
}
