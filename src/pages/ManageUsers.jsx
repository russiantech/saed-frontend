import { Save, UserPlus, ShieldCheck, ShieldOff, Trash2, X, ChevronUp, ChevronDown, Eye, Edit, CheckCircle, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";
import PasswordInput from "../components/PasswordInput.jsx";
import { LAGOS_LGAS } from "../data/nigerianStates.js";

const SKILL_AREAS = [
  "Creative Industry", "Automobile", "Construction", "Agro-Allied",
  "Delivery & Logistics", "Culinary & Catering", "Cleaning Services",
  "Green Energy", "Satellite & Security Technology", "ICT", "Cosmetology", "Education",
];

const emptyCreateForm = {
  fullName: "", email: "", phone: "", password: "", confirmPassword: "",
  specialization: "", yearsExperience: "", companyName: "", bio: "", numberTrained: "",
  partnerLgas: [],
};

const emptyEditForm = {
  fullName: "", phone: "", specialization: "", yearsExperience: "",
  companyName: "", bio: "", partnerLgas: [], numberTrained: "",
};

export default function ManageUsers() {
  const navigate = useNavigate();
  const auth = useAuth();
  const currentUser = auth?.user;
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [sortField, setSortField] = useState("fullName");
  const [sortDir, setSortDir] = useState("asc");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [createFields, setCreateFields] = useState({});
  const [createPartnershipLetter, setCreatePartnershipLetter] = useState(null);
  const [createAgree, setCreateAgree] = useState(false);
  const [creating, setCreating] = useState(false);

  const [viewUser, setViewUser] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [editFields, setEditFields] = useState({});
  const [editPartnershipLetter, setEditPartnershipLetter] = useState(null);
  const [saving, setSaving] = useState(false);

  function toggleSort(field) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  }

  function showMsg(text, type) { setMessage(text); setMessageType(type || ""); }

  async function load() {
    const data = await api("/manage/users/");
    setUsers(data.users || []);
  }

  useEffect(() => {
    load().catch((err) => {
      if (err.status === 401) navigate("/login", { replace: true });
      else showMsg(err.message, "error");
    }).finally(() => setLoading(false));
  }, [navigate]);

  function updateCreate(key, value) { setCreateForm((c) => ({ ...c, [key]: value })); }
  function updateEdit(key, value) { setEditForm((c) => ({ ...c, [key]: value })); }

  function toggleCreateLga(lga) {
    setCreateForm((c) => ({
      ...c,
      partnerLgas: c.partnerLgas.includes(lga) ? c.partnerLgas.filter((l) => l !== lga) : [...c.partnerLgas, lga],
    }));
  }

  function toggleEditLga(lga) {
    setEditForm((c) => ({
      ...c,
      partnerLgas: c.partnerLgas.includes(lga) ? c.partnerLgas.filter((l) => l !== lga) : [...c.partnerLgas, lga],
    }));
  }

  function validateCreate() {
    const next = {};
    if (createForm.fullName.trim().split(/\s+/).length < 2) next.fullName = "Enter first and last name.";
    if (!/^\S+@\S+\.\S+$/.test(createForm.email)) next.email = "Enter a valid email address.";
    if (!createForm.phone.trim()) next.phone = "Phone number is required.";
    if (!createForm.specialization) next.specialization = "Select a specialization.";
    if (!createForm.password) next.password = "Password is required.";
    else if (createForm.password.length < 8) next.password = "Use at least 8 characters.";
    if (createForm.password !== createForm.confirmPassword) next.confirmPassword = "Passwords do not match.";
    if (!createForm.bio.trim()) next.bio = "Bio is required.";
    else if (createForm.bio.trim().length < 20) next.bio = "Bio must be at least 20 characters.";
    if (!createAgree) next.agree = "You must agree to the terms.";
    setCreateFields(next);
    return Object.keys(next).length === 0;
  }

  async function handleCreate(e) {
    e.preventDefault();
    showMsg("");
    if (!validateCreate()) return;
    setCreating(true);
    try {
      const fd = new FormData();
      fd.append("fullName", createForm.fullName);
      fd.append("email", createForm.email);
      fd.append("phone", createForm.phone);
      fd.append("role", "trainer");
      fd.append("password", createForm.password);
      fd.append("specialization", createForm.specialization);
      fd.append("yearsExperience", createForm.yearsExperience || "0");
      fd.append("companyName", createForm.companyName);
      fd.append("bio", createForm.bio);
      fd.append("numberTrained", createForm.numberTrained || "0");
      fd.append("partnerLgas", JSON.stringify(createForm.partnerLgas));
      if (createPartnershipLetter) fd.append("partnershipLetter", createPartnershipLetter);
      await api("/manage/users/", { method: "POST", body: fd });
      setShowCreateModal(false);
      setCreateForm(emptyCreateForm);
      setCreatePartnershipLetter(null);
      setCreateAgree(false);
      setCreateFields({});
      await load();
      showMsg("Trainer created successfully.", "success");
    } catch (err) {
      setCreateFields(err.data?.fields || {});
      showMsg(err.message, "error");
    } finally {
      setCreating(false);
    }
  }

  function openEdit(user) {
    setEditUser(user);
    setEditForm({
      fullName: user.fullName || "",
      phone: user.phone || "",
      specialization: user.specialization || "",
      yearsExperience: user.yearsExperience || "",
      companyName: user.companyName || "",
      bio: user.bio || "",
      partnerLgas: user.partnerLgas || [],
      numberTrained: user.numberTrained || "",
    });
    setEditFields({});
    setEditPartnershipLetter(null);
  }

  async function handleEditSave(e) {
    e.preventDefault();
    showMsg("");
    const next = {};
    if (editForm.fullName.trim().split(/\s+/).length < 2) next.fullName = "Enter first and last name.";
    if (editForm.bio.trim().length < 20) next.bio = "Bio must be at least 20 characters.";
    setEditFields(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("fullName", editForm.fullName);
      fd.append("phone", editForm.phone);
      fd.append("specialization", editForm.specialization);
      fd.append("yearsExperience", editForm.yearsExperience || "0");
      fd.append("companyName", editForm.companyName);
      fd.append("bio", editForm.bio);
      fd.append("numberTrained", editForm.numberTrained || "0");
      fd.append("partnerLgas", JSON.stringify(editForm.partnerLgas));
      if (editPartnershipLetter) fd.append("partnershipLetter", editPartnershipLetter);
      await api(`/manage/users/${editUser.id}/`, { method: "PATCH", body: fd });
      setEditUser(null);
      await load();
      showMsg("Trainer updated.", "success");
    } catch (err) {
      setEditFields(err.data?.fields || {});
      showMsg(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function updateUser(user, changes) {
    showMsg("");
    try {
      await api(`/manage/users/${user.id}/`, { method: "PATCH", body: changes });
      await load();
      showMsg("User updated.", "success");
    } catch (err) { showMsg(err.message, "error"); }
  }

  const trainers = users.filter((u) => u.role === "trainer");
  const filtered = filter === "all" ? trainers : trainers.filter((u) => {
    if (filter === "approved") return u.isAuthorized;
    if (filter === "pending") return !u.isAuthorized && u.authorizationStatus === "pending";
    if (filter === "declined") return u.authorizationStatus === "declined";
    if (filter === "removed") return u.authorizationStatus === "removed";
    return true;
  });

  const sortedUsers = useMemo(() => {
    let result = [...filtered];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((u) => u.fullName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.specialization?.toLowerCase().includes(q));
    }
    return result.sort((a, b) => {
      let aVal = a[sortField] || "";
      let bVal = b[sortField] || "";
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortField, sortDir, search]);

  const totalPages = Math.ceil(sortedUsers.length / PAGE_SIZE);
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sortedUsers.slice(start, start + PAGE_SIZE);
  }, [sortedUsers, page]);

  useEffect(() => { setPage(1); }, [filter, search]);

  const statusLabels = { pending: "Pending Review", approved: "Approved", declined: "Declined", removed: "Removed" };

  return (
    <section className="panel full-panel">
      <div className="panel-heading">
        <div>
          <h2>Trainer Management</h2>
          <p>Review, approve, decline, or remove trainer registrations.</p>
        </div>
        <button className="primary-button" onClick={() => setShowCreateModal(true)} type="button">
          <UserPlus size={16} /> Add Trainer
        </button>
      </div>

      {message && (
        <div className={`inline-message inline-message--${messageType || "error"}`}>
          {message}
          <button type="button" className="inline-message-close" onClick={() => showMsg("")}><X size={16} /></button>
        </div>
      )}

      <div className="filter-tabs">
        {["all", "approved", "pending", "declined", "removed"].map((f) => (
          <button key={f} className={`filter-tab ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)} type="button">
            {f === "all" ? `All (${trainers.length})` : `${statusLabels[f]} (${trainers.filter((u) => u.authorizationStatus === f).length})`}
          </button>
        ))}
      </div>

      {loading ? <div className="empty-state">Loading trainers...</div> : null}
      {!loading ? (
        <>
          <div className="search-input-wrap">
            <Search size={16} />
            <input type="text" placeholder="Search trainers..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="management-table">
          <div className="management-row table-head">
            <span className="sortable" onClick={() => toggleSort("fullName")}>Name {sortField === "fullName" ? (sortDir === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />) : ""}</span>
            <span className="sortable" onClick={() => toggleSort("specialization")}>Specialization {sortField === "specialization" ? (sortDir === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />) : ""}</span>
            <span className="sortable" onClick={() => toggleSort("isActive")}>Status {sortField === "isActive" ? (sortDir === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />) : ""}</span>
            <span className="sortable" onClick={() => toggleSort("authorizationStatus")}>Authorization {sortField === "authorizationStatus" ? (sortDir === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />) : ""}</span>
            <span>Actions</span>
          </div>
          {paginatedUsers.map((user) => (
            <div className="management-row" key={user.id}>
              <div><strong>{user.fullName}</strong><span>{user.email}</span></div>
              <span>{user.specialization || "—"}</span>
              <span className={`status-pill status-${user.isActive ? "approved" : "declined"}`}>{user.isActive ? "active" : "inactive"}</span>
              <span className={`status-pill status-${user.authorizationStatus === "approved" ? "approved" : user.authorizationStatus === "declined" ? "declined" : user.authorizationStatus === "removed" ? "declined" : "pending"}`}>
                {statusLabels[user.authorizationStatus] || "Pending"}
              </span>
              <div className="action-buttons">
                <button className="icon-action" onClick={() => setViewUser(user)} type="button" title="View">
                  <Eye size={16} /> <span>View</span>
                </button>
                <button className="icon-action" onClick={() => openEdit(user)} type="button" title="Edit">
                  <Edit size={16} /> <span>Edit</span>
                </button>
                {user.authorizationStatus !== "approved" && currentUser?.role !== "dunis_admin" && (
                  <button className="icon-action" disabled={user.id === currentUser?.id}
                    onClick={() => updateUser(user, { authorizationStatus: "approved", isAuthorized: true })} type="button">
                    <ShieldCheck size={16} /> <span>Approve</span>
                  </button>
                )}
                {user.authorizationStatus === "approved" && currentUser?.role !== "dunis_admin" && (
                  <button className="icon-action" disabled={user.id === currentUser?.id}
                    onClick={() => updateUser(user, { authorizationStatus: "pending", isAuthorized: false })} type="button">
                    <ShieldOff size={16} /> <span>Disapprove</span>
                  </button>
                )}
                {user.authorizationStatus !== "declined" && user.authorizationStatus !== "removed" && user.authorizationStatus !== "approved" && currentUser?.role !== "dunis_admin" && (
                  <button className="icon-action" disabled={user.id === currentUser?.id}
                    onClick={() => updateUser(user, { authorizationStatus: "declined", isAuthorized: false })} type="button">
                    <ShieldOff size={16} /> <span>Decline</span>
                  </button>
                )}
                {user.authorizationStatus !== "removed" && currentUser?.role !== "saed_admin" && (
                  <button className="icon-action" disabled={user.id === currentUser?.id}
                    onClick={() => updateUser(user, { authorizationStatus: "removed", isAuthorized: false, isActive: false })} type="button">
                    <Trash2 size={16} /> <span>Remove</span>
                  </button>
                )}
                {currentUser?.role !== "saed_admin" && (
                  <button className="icon-action" disabled={user.id === currentUser?.id}
                    onClick={() => updateUser(user, { isActive: !user.isActive })}
                    title={user.id === currentUser?.id ? "You cannot deactivate your own account" : undefined} type="button">
                    <Save size={16} />
                    <span>{user.id === currentUser?.id ? "Current User" : user.isActive ? "Deactivate" : "Activate"}</span>
                  </button>
                )}
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
      ) : null}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content modal-trainer-form" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Trainer Account</h2>
              <p>Register a new trainer and help corps members learn new skills.</p>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}><X size={24} strokeWidth={2.5} /></button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="modal-form-section">
                <h3>Account Information</h3>
                <div className="form-grid-2">
                  <label>Full Name *
                    <input value={createForm.fullName} onChange={(e) => updateCreate("fullName", e.target.value)} placeholder="Enter full name" />
                  </label>
                  {createFields.fullName && <span className="field-error">{createFields.fullName}</span>}
                  <label>Email Address *
                    <input type="email" value={createForm.email} onChange={(e) => updateCreate("email", e.target.value)} placeholder="you@example.com" />
                  </label>
                  {createFields.email && <span className="field-error">{createFields.email}</span>}
                </div>
                <div className="form-grid-2">
                  <label>Phone Number *
                    <input value={createForm.phone} onChange={(e) => updateCreate("phone", e.target.value)} placeholder="+234 012 345 6789" />
                  </label>
                  {createFields.phone && <span className="field-error">{createFields.phone}</span>}
                  <label>Specialization / Skill Area *
                    <select value={createForm.specialization} onChange={(e) => updateCreate("specialization", e.target.value)}>
                      <option value="">Select your Skill Area</option>
                      {SKILL_AREAS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </label>
                  {createFields.specialization && <span className="field-error">{createFields.specialization}</span>}
                </div>
                <div className="form-grid-2">
                  <label>Years of Experience
                    <input type="number" min="0" max="50" value={createForm.yearsExperience} onChange={(e) => updateCreate("yearsExperience", e.target.value)} placeholder="e.g. 5" />
                  </label>
                  <label>Company Name
                    <input value={createForm.companyName} onChange={(e) => updateCreate("companyName", e.target.value)} placeholder="Enter your company" />
                  </label>
                </div>
              </div>

              <div className="modal-form-section">
                <h3>Partner Local Government Areas</h3>
                <div className="lga-checkbox-grid">
                  {LAGOS_LGAS.map((l) => (
                    <label key={l} className="checkbox-label">
                      <input type="checkbox" checked={createForm.partnerLgas.includes(l)} onChange={() => toggleCreateLga(l)} />
                      <span className="checkbox-custom" />
                      {l}
                    </label>
                  ))}
                </div>
              </div>

              <div className="modal-form-section">
                <h3>Additional Details</h3>
                <label>About Me / Bio *
                  <textarea value={createForm.bio} onChange={(e) => updateCreate("bio", e.target.value)} placeholder="Tell us about yourself (250 characters)" rows={3} maxLength={250} />
                </label>
                {createFields.bio && <span className="field-error">{createFields.bio}</span>}
                <div className="form-grid-2">
                  <label>Number of Trained
                    <input type="number" min="0" value={createForm.numberTrained} onChange={(e) => updateCreate("numberTrained", e.target.value)} placeholder="Enter Number of Trained Student" />
                  </label>
                  <label>Partnership Letter
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setCreatePartnershipLetter(e.target.files?.[0] || null)} />
                  </label>
                </div>
                {createPartnershipLetter && <span className="form-hint">{createPartnershipLetter.name}</span>}
              </div>

              <div className="modal-form-section">
                <h3>Security</h3>
                <div className="form-grid-2">
                  <label>Password *
                    <PasswordInput value={createForm.password} onChange={(e) => updateCreate("password", e.target.value)} placeholder="Create a password" />
                  </label>
                  {createFields.password && <span className="field-error">{createFields.password}</span>}
                  <label>Confirm Password *
                    <PasswordInput value={createForm.confirmPassword} onChange={(e) => updateCreate("confirmPassword", e.target.value)} placeholder="Confirm password" />
                  </label>
                  {createFields.confirmPassword && <span className="field-error">{createFields.confirmPassword}</span>}
                </div>
              </div>

              <label className="checkbox-label" style={{ marginBottom: 16 }}>
                <input type="checkbox" checked={createAgree} onChange={(e) => setCreateAgree(e.target.checked)} />
                <span className="checkbox-custom" />
                I agree to the Terms and Services
              </label>
              {createFields.agree && <span className="field-error">{createFields.agree}</span>}

              <button className="primary-button create-trainer-btn" type="submit" disabled={creating}>
                <CheckCircle size={18} /> {creating ? "Creating..." : "Create Trainer Account"}
              </button>
            </form>
          </div>
        </div>
      )}

      {viewUser && (
        <div className="modal-overlay" onClick={() => setViewUser(null)}>
          <div className="modal-content modal-trainer-form" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Trainer Profile</h2>
              <button className="modal-close" onClick={() => setViewUser(null)}><X size={24} strokeWidth={2.5} /></button>
            </div>
            <div className="view-trainer-details">
              <div className="view-field"><span>Full Name</span><strong>{viewUser.fullName}</strong></div>
              <div className="view-field"><span>Email</span><strong>{viewUser.email}</strong></div>
              <div className="view-field"><span>Phone</span><strong>{viewUser.phone || "—"}</strong></div>
              <div className="view-field"><span>Specialization</span><strong>{viewUser.specialization || "—"}</strong></div>
              <div className="view-field"><span>Years of Experience</span><strong>{viewUser.yearsExperience || "—"}</strong></div>
              <div className="view-field"><span>Company Name</span><strong>{viewUser.companyName || "—"}</strong></div>
              <div className="view-field"><span>Bio</span><strong>{viewUser.bio || "—"}</strong></div>
              <div className="view-field"><span>Status</span>
                <span className={`status-pill status-${viewUser.isActive ? "approved" : "declined"}`}>{viewUser.isActive ? "Active" : "Inactive"}</span>
              </div>
              <div className="view-field"><span>Authorization</span>
                <span className={`status-pill status-${viewUser.authorizationStatus === "approved" ? "approved" : "pending"}`}>
                  {statusLabels[viewUser.authorizationStatus] || "Pending"}
                </span>
              </div>
              {currentUser?.role !== "saed_admin" && (
                <div className="view-field"><span>Payment</span>
                  {viewUser.paymentVerified
                    ? <span className="status-pill status-approved">Verified</span>
                    : <span className="status-pill status-pending">Pending</span>
                  }
                </div>
              )}
              {viewUser.partnershipLetter && (
                <div className="view-field"><span>Partnership Letter</span>
                  <div className="letter-viewer">
                    {viewUser.partnershipLetter.match(/\.(pdf)$/i) ? (
                      <iframe src={viewUser.partnershipLetter} title="Partnership Letter" className="letter-iframe" />
                    ) : viewUser.partnershipLetter.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <img src={viewUser.partnershipLetter} alt="Partnership Letter" className="letter-image" />
                    ) : viewUser.partnershipLetter.match(/\.(docx?|doc)$/i) ? (
                      <iframe src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(window.location.origin + viewUser.partnershipLetter)}`} title="Partnership Letter" className="letter-iframe" />
                    ) : (
                      <a href={viewUser.partnershipLetter} target="_blank" rel="noopener noreferrer">View Letter</a>
                    )}
                  </div>
                </div>
              )}
              {viewUser.partnerLgas?.length > 0 && (
                <div className="view-field"><span>Partner LGAs</span>
                  <div className="lga-tags">{viewUser.partnerLgas.map((l) => <span key={l} className="lga-tag">{l}</span>)}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {editUser && (
        <div className="modal-overlay" onClick={() => setEditUser(null)}>
          <div className="modal-content modal-trainer-form" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Trainer</h2>
              <button className="modal-close" onClick={() => setEditUser(null)}><X size={24} strokeWidth={2.5} /></button>
            </div>
            <form onSubmit={handleEditSave}>
              <div className="modal-form-section">
                <h3>Account Information</h3>
                <div className="form-grid-2">
                  <label>Full Name *
                    <input value={editForm.fullName} onChange={(e) => updateEdit("fullName", e.target.value)} />
                  </label>
                  {editFields.fullName && <span className="field-error">{editFields.fullName}</span>}
                  <label>Phone
                    <input value={editForm.phone} onChange={(e) => updateEdit("phone", e.target.value)} />
                  </label>
                </div>
                <div className="form-grid-2">
                  <label>Specialization
                    <select value={editForm.specialization} onChange={(e) => updateEdit("specialization", e.target.value)}>
                      <option value="">Select Specialization</option>
                      {SKILL_AREAS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </label>
                  <label>Years of Experience
                    <input type="number" min="0" max="50" value={editForm.yearsExperience} onChange={(e) => updateEdit("yearsExperience", e.target.value)} />
                  </label>
                </div>
                <div className="form-grid-2">
                  <label>Company Name
                    <input value={editForm.companyName} onChange={(e) => updateEdit("companyName", e.target.value)} />
                  </label>
                  <label>Number of Trained
                    <input type="number" min="0" value={editForm.numberTrained} onChange={(e) => updateEdit("numberTrained", e.target.value)} />
                  </label>
                </div>
              </div>

              <div className="modal-form-section">
                <h3>Partner Local Government Areas</h3>
                <div className="lga-checkbox-grid">
                  {LAGOS_LGAS.map((l) => (
                    <label key={l} className="checkbox-label">
                      <input type="checkbox" checked={editForm.partnerLgas.includes(l)} onChange={() => toggleEditLga(l)} />
                      <span className="checkbox-custom" />
                      {l}
                    </label>
                  ))}
                </div>
              </div>

              <div className="modal-form-section">
                <label>Bio
                  <textarea value={editForm.bio} onChange={(e) => updateEdit("bio", e.target.value)} rows={3} />
                </label>
                {editFields.bio && <span className="field-error">{editFields.bio}</span>}
                <label>Partnership Letter
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setEditPartnershipLetter(e.target.files?.[0] || null)} />
                </label>
                {editPartnershipLetter && <span className="form-hint">{editPartnershipLetter.name}</span>}
                {editUser.partnershipLetter && !editPartnershipLetter && (
                  <span className="form-hint">Current: <a href={editUser.partnershipLetter} target="_blank" rel="noopener noreferrer">View uploaded letter</a></span>
                )}
              </div>

              <div className="modal-actions">
                <button type="button" className="outline-button" onClick={() => setEditUser(null)}>Cancel</button>
                <button type="submit" className="primary-button" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
