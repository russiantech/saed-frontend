import { ChevronRight, UserPlus, CheckCircle, X, Search } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";

import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";

export default function MyTrainers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [allTrainers, setAllTrainers] = useState([]);
  const [connectedIds, setConnectedIds] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const skill = user?.skillInterest || "";
  const lga = user?.lgaOfDeployment || "";

  useEffect(() => {
    async function load() {
      try {
        const [trainerData, connData] = await Promise.all([
          api("/trainers/"),
          api("/connections/"),
        ]);
        setAllTrainers(trainerData.trainers || []);
        const connMap = new Map();
        (connData.connections || []).forEach((c) => connMap.set(c.trainer?.id, c.status));
        setConnectedIds(connMap);
      } catch {
        setError("Failed to load trainers.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const sortedTrainers = useMemo(() => {
    const sorted = [...allTrainers];
    sorted.sort((a, b) => {
      const aConn = connectedIds.has(a.id) ? 0 : 1;
      const bConn = connectedIds.has(b.id) ? 0 : 1;
      return aConn - bConn;
    });
    return sorted;
  }, [allTrainers, connectedIds]);

  const filtered = useMemo(() => {
    if (!search) return sortedTrainers;
    const q = search.toLowerCase();
    return sortedTrainers.filter((t) =>
      t.fullName?.toLowerCase().includes(q) || t.specialization?.toLowerCase().includes(q)
    );
  }, [sortedTrainers, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) return <div className="empty-state">Loading trainers...</div>;
  if (error) return (
    <div className="inline-message inline-message--error">
      {error}
      <button type="button" className="inline-message-close" onClick={() => setError("")}><X size={16} /></button>
    </div>
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Trainers</h1>
        <p>Browse and connect with authorized trainers</p>
      </div>

      <div className="search-input-wrap">
        <Search size={16} />
        <input type="text" placeholder="Search trainers..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>

      {paginated.length === 0 ? (
        <div className="empty-state">
          <p>{search ? "No trainers match your search." : "No trainers found."}</p>
        </div>
      ) : (
        <>
          <div className="trainer-list">
            {paginated.map((trainer) => (
              <div
                key={trainer.id}
                className="program-row clickable trainer-record"
                onClick={() => navigate(`/app/connect-trainer/${trainer.id}`)}
              >
                <div>
                  <div className="trainer-avatar-inline">
                    {trainer.profilePicture ? (
                      <img src={trainer.profilePicture} alt={trainer.fullName} />
                    ) : (
                      trainer.fullName?.charAt(0)
                    )}
                  </div>
                  <div>
                    <strong>{trainer.fullName}</strong>
                    <span>{trainer.specialization} · {trainer.companyName || "Independent"}</span>
                    <span>{trainer.bio?.slice(0, 80)}{trainer.bio?.length > 80 ? "…" : ""}</span>
                  </div>
                </div>
                <div className="trainer-row-actions">
                  {connectedIds.has(trainer.id) ? (
                    <span className={`status-pill ${connectedIds.get(trainer.id) === "active" ? "status-approved" : "status-pending"}`}>
                      {connectedIds.get(trainer.id) === "active" ? <><CheckCircle size={14} /> Connected</> : "Pending"}
                    </span>
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
          {totalPages > 1 && (
            <div className="pagination">
              <button className="outline-button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
              <span className="pagination-info">Page {page} of {totalPages}</span>
              <button className="outline-button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
