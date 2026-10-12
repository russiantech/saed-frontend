import { Edit3, PlusCircle, X, Ban, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../../lib/api.js";
import ConfirmModal from "../../components/ui/ConfirmModal.jsx";

const blankProgram = {
  title: "",
  category: "ict",
  description: "",
  durationWeeks: 4,
  capacity: 40,
  trainerId: "",
  trainerName: "",
  location: "",
  startDate: "",
  endDate: "",
  isActive: true,
};

export default function ProgramEditor() {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [selectedId, setSelectedId] = useState("new");
  const [form, setForm] = useState(blankProgram);
  const [fields, setFields] = useState({});
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmDestructive, setConfirmDestructive] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  function showMsg(text, type) {
    setMessage(text);
    setMessageType(type || "");
  }

  function openConfirm(title, message, onConfirm, destructive = false) {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmDestructive(destructive);
    setConfirmAction(() => onConfirm);
    setConfirmOpen(true);
  }

  function handleConfirm() {
    if (confirmAction) confirmAction();
    setConfirmOpen(false);
    setConfirmAction(null);
  }

  async function load() {
    const data = await api("/manage/programs/");
    setPrograms(data.programs || []);
    setCategories(data.categories || []);
    setTrainers(data.trainers || []);
  }

  useEffect(() => {
    load().catch((err) => {
      if (err.status === 401) navigate("/login", { replace: true });
      else showMsg(err.message, "error");
    });
  }, [navigate]);

  function chooseProgram(value) {
    setSelectedId(value);
    setFields({});
    if (value === "new") {
      setForm(blankProgram);
      setEditorOpen(true);
      return;
    }
    const program = programs.find((item) => String(item.id) === value);
    if (program) {
      setForm({ ...program, trainerId: program.trainerId || "" });
      setEditorOpen(true);
    }
  }

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function validate() {
    const next = {};
    ["title", "description", "location"].forEach((key) => {
      if (!String(form[key] || "").trim()) next[key] = "This field is required.";
    });
    if (!form.trainerId) next.trainerId = "Choose a trainer.";
    if (Number(form.durationWeeks) < 1) next.durationWeeks = "Duration must be at least 1 week.";
    if (Number(form.capacity) < 1) next.capacity = "Capacity must be at least 1.";
    if (!form.startDate) next.startDate = "Start date is required.";
    if (!form.endDate) next.endDate = "End date is required.";
    if (form.startDate && form.endDate && new Date(form.endDate) < new Date(form.startDate)) {
      next.endDate = "End date must be after start date.";
    }
    setFields(next);
    return Object.keys(next).length === 0;
  }

  async function save(event) {
    event.preventDefault();
    showMsg("");
    if (!validate()) return;
    const method = selectedId === "new" ? "POST" : "PATCH";
    const path = selectedId === "new" ? "/manage/programs/" : `/manage/programs/${selectedId}/`;
    try {
      const data = await api(path, { method, body: form });
      await load();
      setSelectedId(String(data.program.id));
      setForm({ ...data.program, trainerId: data.program.trainerId || "" });
      setFields({});
      setEditorOpen(false);
      showMsg("Course saved.", "success");
    } catch (err) {
      setFields(err.data?.fields || {});
      showMsg(err.message, "error");
    }
  }

  async function toggleRestrict(program) {
    const action = program.isRestricted ? "unrestrict" : "restrict";
    openConfirm(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Course`,
      `Are you sure you want to ${action} this course?`,
      async () => {
        try {
          await api(`/manage/programs/${program.id}/${action}/`, { method: "POST" });
          await load();
          showMsg(`Course ${action}ed successfully.`, "success");
        } catch (err) {
          showMsg(err.message || `Failed to ${action} course`, "error");
        }
      },
      action === "restrict"
    );
  }

  return (
    <section className="panel full-panel course-editor-panel">
      <div className="panel-heading">
        <div>
          <h2>Courses</h2>
          <p>Create new SAED courses and edit existing training records.</p>
        </div>
        <button className="primary-button" onClick={() => chooseProgram("new")} type="button"><PlusCircle size={16} /> New Course</button>
      </div>

      {message && (
        <div className={`inline-message inline-message--${messageType || "error"}`}>
          {message}
          <button type="button" className="inline-message-close" onClick={() => showMsg("")}><X size={16} /></button>
        </div>
      )}

      <ConfirmModal open={confirmOpen} title={confirmTitle} message={confirmMessage} destructive={confirmDestructive} onConfirm={handleConfirm} onCancel={() => setConfirmOpen(false)} />

      <div className="course-admin-grid">
        {programs.map((program) => (
          <article className={String(program.id) === selectedId ? "course-admin-card active-row" : "course-admin-card"} key={program.id}>
            <div>
              <span className="category-label">{program.category.replace(/_/g, " ")}</span>
              <h3>{program.title}</h3>
              <p>{program.description}</p>
            </div>
            <dl>
              <div><dt>Trainer</dt><dd>{program.trainerName || "Unassigned"}</dd></div>
              <div><dt>Location</dt><dd>{program.location}</dd></div>
              <div><dt>Duration</dt><dd>{program.durationWeeks} weeks</dd></div>
              <div><dt>Slots</dt><dd>{program.availableSlots} / {program.capacity}</dd></div>
            </dl>
            <div className="course-admin-card-actions">
              <span className={`status-pill status-${program.isActive ? "approved" : "declined"}`}>{program.isActive ? "Active" : "Inactive"}</span>
              {program.isRestricted && <span className="status-pill status-restricted">Restricted</span>}
              <button className="icon-action" onClick={() => chooseProgram(String(program.id))} type="button">
                <Edit3 size={16} />
                <span>Edit</span>
              </button>
              <button className="icon-action" onClick={() => toggleRestrict(program)} type="button" title={program.isRestricted ? "Unrestrict" : "Restrict"}>
                {program.isRestricted ? <ShieldAlert size={16} /> : <Ban size={16} />}
                <span>{program.isRestricted ? "Unrestrict" : "Restrict"}</span>
              </button>
            </div>
          </article>
        ))}
      </div>

      {editorOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setEditorOpen(false)}>
          <article className="detail-modal course-editor-modal" role="dialog" aria-modal="true" aria-labelledby="course-editor-title" onClick={(event) => event.stopPropagation()}>
            <div className="detail-modal-heading">
              <div>
                <span className="category-label">{selectedId === "new" ? "New Course" : "Edit Course"}</span>
                <h3 id="course-editor-title">{selectedId === "new" ? "Create Course" : form.title}</h3>
              </div>
              <button className="icon-action" onClick={() => setEditorOpen(false)} type="button" aria-label="Close editor">
                <X size={16} />
              </button>
            </div>
            <form className="management-form editor-form" onSubmit={save}>
              <label>Title<input value={form.title} onChange={(e) => update("title", e.target.value)} /></label>
              {fields.title && <span className="field-error">{fields.title}</span>}
              <label>Category<select value={form.category} onChange={(e) => update("category", e.target.value)}>{categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
              {fields.category && <span className="field-error">{fields.category}</span>}
              <label>Description<textarea value={form.description} onChange={(e) => update("description", e.target.value)} /></label>
              {fields.description && <span className="field-error">{fields.description}</span>}
              <label>Duration Weeks<input type="number" min="1" value={form.durationWeeks} onChange={(e) => update("durationWeeks", e.target.value)} /></label>
              {fields.durationWeeks && <span className="field-error">{fields.durationWeeks}</span>}
              <label>Capacity<input type="number" min="1" value={form.capacity} onChange={(e) => update("capacity", e.target.value)} /></label>
              {fields.capacity && <span className="field-error">{fields.capacity}</span>}
              <label>Trainer<select value={form.trainerId || ""} onChange={(e) => update("trainerId", e.target.value)}><option value="">Select trainer</option>{trainers.map((trainer) => <option key={trainer.id} value={trainer.id}>{trainer.fullName}</option>)}</select></label>
              {fields.trainerId && <span className="field-error">{fields.trainerId}</span>}
              <label>Location<input value={form.location} onChange={(e) => update("location", e.target.value)} /></label>
              {fields.location && <span className="field-error">{fields.location}</span>}
              <label>Start Date<input type="date" required value={form.startDate} onChange={(e) => update("startDate", e.target.value)} /></label>
              {fields.startDate && <span className="field-error">{fields.startDate}</span>}
              <label>End Date<input type="date" required value={form.endDate} onChange={(e) => update("endDate", e.target.value)} /></label>
              {fields.endDate && <span className="field-error">{fields.endDate}</span>}
              <label className="checkbox-label"><input type="checkbox" checked={form.isActive} onChange={(e) => update("isActive", e.target.checked)} /> Active course</label>
              <button className="primary-button"><PlusCircle size={16} /> Save Course</button>
            </form>
          </article>
        </div>
      ) : null}
    </section>
  );
}
