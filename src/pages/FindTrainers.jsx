import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { UserPlus, CheckCircle, ChevronRight } from "lucide-react";

import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";
import { NIGERIAN_STATES } from "../data/nigerianStates.js";

const SKILL_AREAS = [
  "Creative Industry", "Automobile", "Construction", "Agro-Allied",
  "Delivery & Logistics", "Culinary & Catering", "Cleaning Services",
  "Green Energy", "Satellite & Security Technology", "ICT", "Cosmetology", "Education",
];

export default function FindTrainers() {
  const { user } = useAuth();
  const [lga, setLga] = useState("");
  const [skill, setSkill] = useState("");
  const [trainers, setTrainers] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(false);

  const stateKey = user?.stateOfDeployment || "Lagos";
  const deploymentLgas = NIGERIAN_STATES[stateKey] || NIGERIAN_STATES["Lagos"] || [];

  useEffect(() => {
    async function load() {
      try {
        const [trainerData, connData] = await Promise.all([
          api("/trainers/"),
          api("/connections/"),
        ]);
        setTrainers(trainerData.trainers || []);
        setConnections(connData.connections || []);
      } catch {
        setTrainers([]);
        setConnections([]);
      }
    }
    load();
  }, []);

  async function searchTrainers() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ lga, skill });
      const data = await api(`/trainers/?${params}`);
      setTrainers(data.trainers || []);
    } catch {
      setTrainers([]);
    } finally {
      setLoading(false);
    }
  }

  const connectedTrainerIds = new Set(connections.map((c) => c.trainer?.id));

  const sortedTrainers = [...trainers].sort((a, b) => {
    const aConn = connectedTrainerIds.has(a.id) ? 0 : 1;
    const bConn = connectedTrainerIds.has(b.id) ? 0 : 1;
    return aConn - bConn;
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Find Trainers</h1>
          <p>Discover and connect with authorized trainers</p>
        </div>
      </div>

      <div className="search-bar">
        <div className="search-field">
          <label>Location</label>
          <select value={lga} onChange={(e) => setLga(e.target.value)}>
            <option value="">All Locations</option>
            {deploymentLgas.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div className="search-field">
          <label>Skill Area</label>
          <select value={skill} onChange={(e) => setSkill(e.target.value)}>
            <option value="">All Skills</option>
            {SKILL_AREAS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button className="primary-button" onClick={searchTrainers} disabled={loading} style={{ alignSelf: "flex-end", whiteSpace: "nowrap" }}>
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {loading ? (
        <div className="empty-state">Searching trainers...</div>
      ) : trainers.length === 0 ? (
        <div className="empty-state">
          <p>No trainers found matching your filters.</p>
        </div>
      ) : (
        <div className="trainer-list">
          {sortedTrainers.map((trainer) => (
            <div key={trainer.id} className="program-row clickable trainer-record">
              <div>
                <div className="trainer-avatar-inline">
                  {trainer.profilePicture ? (
                    <img src={trainer.profilePicture} alt={trainer.fullName} />
                  ) : (
                    trainer.fullName?.charAt(0) || "?"
                  )}
                </div>
                <div>
                  <strong>{trainer.fullName}</strong>
                  <span>{trainer.specialization} · {trainer.companyName || "Independent"}</span>
                  <span>{trainer.bio?.slice(0, 80)}{trainer.bio?.length > 80 ? "…" : ""}</span>
                </div>
              </div>
              <div className="trainer-row-actions">
                {connectedTrainerIds.has(trainer.id) ? (
                  <span className="status-pill status-approved"><CheckCircle size={14} /> Connected</span>
                ) : (
                  <Link to={`/app/connect-trainer/${trainer.id}`} className="primary-button small">
                    <UserPlus size={14} /> View Profile
                  </Link>
                )}
                <ChevronRight size={18} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
