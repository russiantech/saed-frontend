import { ArrowLeft, Send, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";

export default function SaedQuestionForm() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState("");
  const [resultType, setResultType] = useState("");

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
        },
      });
      setResult("Your question has been submitted. A SAED admin will review it shortly.");
      setResultType("success");
      setSubject("");
      setMessage("");
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
        <Link className="back-link" to="/inactive-account"><ArrowLeft size={16} /> Back</Link>
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
          <button className="primary-button" type="submit" disabled={sending} style={{ width: "100%" }}>
            <Send size={16} /> {sending ? "Sending..." : "Submit Question"}
          </button>
        </form>
      </div>
    </section>
  );
}
