import { UserCheck, ChevronRight, CheckCircle, XCircle, X, Search } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../lib/api.js";

const PAGE_SIZE = 10;

export default function MyCorpers() {
  const navigate = useNavigate();
  const [corpers, setCorpers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [messageType, setMessageType] = useState("");
  const [actionId, setActionId] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  function showMsg(text, type) {
    setError(text);
    setMessageType(type || "");
  }

  useEffect(() => {
    api("/trainer/corpers/")
      .then((data) => setCorpers(data.corpers || []))
      .catch(() => showMsg("Failed to load corps members.", "error"))
      .finally(() => setLoading(false));
  }, []);

  const filteredCorpers = useMemo(() => {
    if (!search) return corpers;
    const q = search.toLowerCase();
    return corpers.filter((c) => c.corpsMember?.fullName?.toLowerCase().includes(q) || c.corpsMember?.email?.toLowerCase().includes(q) || c.corpsMember?.skillInterest?.toLowerCase().includes(q));
  }, [corpers, search]);

  const totalPages = Math.ceil(filteredCorpers.length / PAGE_SIZE);
  const paginatedCorpers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredCorpers.slice(start, start + PAGE_SIZE);
  }, [filteredCorpers, page]);

  async function handleApprove(e, conn) {
    e.stopPropagation();
    setActionId(conn.id);
    try {
      await api(`/connections/${conn.id}/approve/`, { method: "POST" });
      setCorpers((prev) => prev.map((c) => c.id === conn.id ? { ...c, status: "active" } : c));
      showMsg(`Approved ${conn.corpsMember?.fullName}.`, "success");
    } catch (err) {
      showMsg(err.message, "error");
    } finally {
      setActionId(null);
    }
  }

  async function handleReject(e, conn) {
    e.stopPropagation();
    setActionId(conn.id);
    try {
      await api(`/connections/${conn.id}/reject/`, { method: "POST" });
      setCorpers((prev) => prev.map((c) => c.id === conn.id ? { ...c, status: "cancelled" } : c));
      showMsg(`Declined ${conn.corpsMember?.fullName}.`, "success");
    } catch (err) {
      showMsg(err.message, "error");
    } finally {
      setActionId(null);
    }
  }

  if (loading) return <div className="empty-state">Loading corps members...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1><UserCheck size={24} /> My Corpers</h1>
        <p>Corps members who have connected with you</p>
      </div>

      {error && (
        <div className={`inline-message inline-message--${messageType || "error"}`}>
          {error}
          <button type="button" className="inline-message-close" onClick={() => showMsg("")}><X size={16} /></button>
        </div>
      )}

      {corpers.length === 0 ? (
        <div className="empty-state">
          <p>No corps members have connected with you yet.</p>
        </div>
      ) : (
        <>
          <div className="search-input-wrap">
            <Search size={16} />
            <input type="text" placeholder="Search corps members..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <div className="trainer-list">
            {paginatedCorpers.map((conn) => (
            <div
              key={conn.id}
              className="program-row clickable corper-record"
              onClick={() => navigate(`/app/corper-profile/${conn.corpsMember?.id}`)}
            >
              <div>
                <div className="trainer-avatar-inline">
                  {conn.corpsMember?.profilePicture ? (
                    <img src={conn.corpsMember.profilePicture} alt={conn.corpsMember.fullName} />
                  ) : (
                    conn.corpsMember?.fullName?.charAt(0)
                  )}
                </div>
                <div>
                  <strong>{conn.corpsMember?.fullName}</strong>
                  <span>{conn.corpsMember?.email} · {conn.corpsMember?.lgaOfDeployment || "—"}</span>
                  <span>Skill: {conn.corpsMember?.skillInterest || "—"}</span>
                </div>
              </div>
              <div className="trainer-row-actions">
                <span className={`status-pill status-${conn.status === "active" ? "approved" : conn.status === "pending" ? "pending" : "declined"}`}>
                  {conn.status}
                </span>
                {conn.status === "pending" && (
                  <>
                    <button
                      className="icon-action"
                      disabled={actionId === conn.id}
                      onClick={(e) => handleApprove(e, conn)}
                      type="button"
                    >
                      <CheckCircle size={16} /> <span>Approve</span>
                    </button>
                    <button
                      className="icon-action danger"
                      disabled={actionId === conn.id}
                      onClick={(e) => handleReject(e, conn)}
                      type="button"
                    >
                      <XCircle size={16} /> <span>Decline</span>
                    </button>
                  </>
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
