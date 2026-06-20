import { ArrowLeft, ShieldCheck, CreditCard } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../lib/auth.jsx";
import PasswordInput from "../components/PasswordInput.jsx";
import DarkToggle from "../components/DarkToggle.jsx";

export default function AdminLogin() {
  const [role, setRole] = useState("saed_admin");
  const [form, setForm] = useState({ email: "", password: "" });
  const [fields, setFields] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    const nextFields = {};
    if (!form.email.trim()) nextFields.email = "Email or username is required.";
    if (!form.password) nextFields.password = "Password is required.";
    setFields(nextFields);
    if (Object.keys(nextFields).length) return;

    setSubmitting(true);
    setError("");
    try {
      await login({ ...form, role });
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setFields(err.data?.fields || {});
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page full-width">
      <div className="auth-top">
        <DarkToggle />
      </div>
      <div className="auth-panel">
        <Link className="back-link" to="/"><ArrowLeft size={16} /> Back to Site</Link>
        <h1>Admin Portal</h1>
        <p>Login to access the admin dashboard</p>

        <div className="role-selector">
          <button type="button" className={`role-card ${role === "saed_admin" ? "selected" : ""}`} onClick={() => setRole("saed_admin")}>
            <ShieldCheck size={24} />
            <span>SAED Admin</span>
          </button>
          <button type="button" className={`role-card ${role === "dunis_admin" ? "selected" : ""}`} onClick={() => setRole("dunis_admin")}>
            <CreditCard size={24} />
            <span>Dunis Admin</span>
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>Email or Username *
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="admin@saed-ims.com" type="text" required />
          </label>
          {fields.email && <span className="field-error">{fields.email}</span>}
          <label>Password *
            <PasswordInput value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Enter your password" required />
          </label>
          {fields.password && <span className="field-error">{fields.password}</span>}
          {error && <div className="form-error">{error}</div>}
          <button className="wide-button" disabled={submitting}>{submitting ? "Logging in..." : "Login →"}</button>
        </form>
      </div>
    </main>
  );
}
