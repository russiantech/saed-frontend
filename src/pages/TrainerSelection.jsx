import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";
import { LAGOS_LGAS } from "../data/nigerianStates.js";

export default function TrainerSelection() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState("");
  const [messageType, setMessageType] = useState("");

  const skill = user?.skillInterest || "";
  const lga = user?.lgaOfDeployment || "";

  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams();
    if (lga) params.set("lga", lga);
    if (skill) params.set("skill", skill);
    api(`/trainers/?${params.toString()}`)
      .then((data) => setTrainers(data.trainers || []))
      .catch(() => showMsg("Failed to load trainers.", "error"))
      .finally(() => setLoading(false));
  }, [user, lga, skill]);

  if (!user || user.hasSelectedTrainers) {
    navigate("/app", { replace: true });
    return null;
  }

  function showMsg(text, type) {
    setError(text);
    setMessageType(type || "");
  }

  function toggle(id) {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  async function handleSubmit() {
    if (selected.length === 0) {
      showMsg("Select at least one trainer.", "error");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await api("/select-trainers/", {
        method: "POST",
        body: { trainerIds: selected },
      });
      setUser({ ...user, hasSelectedTrainers: true });
      navigate("/app", { replace: true });
    } catch (err) {
      showMsg(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Welcome! Select Your Trainers</h1>
        <p>We found trainers matching your skill interest ({skill}) and LGA ({lga}). Select at least one to get started.</p>
      </div>

      {loading && <div className="empty-state">Loading trainers...</div>}
      {error && (
        <div className={`inline-message inline-message--${messageType || "error"}`}>
          {error}
          <button type="button" className="inline-message-close" onClick={() => showMsg("")}><X size={16} /></button>
        </div>
      )}

      {!loading && trainers.length === 0 && (
        <div className="empty-state">
          <p>No authorized trainers found for your skill interest and LGA yet.</p>
          <p>You can skip this for now and find trainers later from the Trainers tab.</p>
          <button className="primary-button" onClick={() => {
            setUser({ ...user, hasSelectedTrainers: true });
            navigate("/app", { replace: true });
          }}>Continue to Dashboard</button>
        </div>
      )}

      {!loading && trainers.length > 0 && (
        <>
          <div className="trainer-grid">
            {trainers.map((trainer) => (
              <div
                key={trainer.id}
                className={`trainer-card selectable ${selected.includes(trainer.id) ? "selected" : ""}`}
                onClick={() => toggle(trainer.id)}
              >
                <input type="checkbox" checked={selected.includes(trainer.id)} readOnly />
                <div className="trainer-avatar">
                  {trainer.profilePicture ? (
                    <img src={trainer.profilePicture} alt={trainer.fullName} />
                  ) : (
                    trainer.fullName?.charAt(0)
                  )}
                </div>
                <div className="trainer-info">
                  <h3>{trainer.fullName}</h3>
                  <p className="trainer-spec">{trainer.specialization}</p>
                  {trainer.companyName && <p className="trainer-company">{trainer.companyName}</p>}
                  <p className="trainer-bio">{trainer.bio}</p>
                  <div className="trainer-stats">
                    <span>{trainer.yearsExperience} yrs exp</span>
                    <span>{trainer.numberTrained} trained</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="form-actions-row" style={{ marginTop: 24 }}>
            <button className="primary-button" disabled={submitting || selected.length === 0} onClick={handleSubmit}>
              {submitting ? "Saving..." : `Connect with ${selected.length} Trainer(s)`}
            </button>
            <button className="outline-button" onClick={() => {
              setUser({ ...user, hasSelectedTrainers: true });
              navigate("/app", { replace: true });
            }}>Skip for now</button>
          </div>
        </>
      )}
    </div>
  );
}
