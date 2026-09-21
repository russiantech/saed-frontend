import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Video, Plus, Trash2, Edit, X, ArrowLeft, BookOpen, Clock, Play, FileText, File, HelpCircle, ChevronDown, ChevronRight, Layers, Upload, CreditCard } from "lucide-react";
import ConfirmModal from "../../components/ui/ConfirmModal.jsx";

import { api } from "../../lib/api.js";
import { useAuth } from "../../lib/auth.jsx";

function getVideoThumbnail(url) {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg`;
  return null;
}

const CONTENT_ICONS = { video: Video, text: FileText, quiz: HelpCircle, document: File };

function formatDuration(seconds) {
  if (!seconds) return "\u2014";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function CourseManagement() {
  const { user } = useAuth();

  // ── Shared state ──────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [messageType, setMessageType] = useState("");
  function showMsg(text, type) { setError(text); setMessageType(type || ""); }

  // ── Course list state ─────────────────────────────────────────────────────
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseForm, setCourseForm] = useState({
    title: "", description: "", category: "", price: "",
    durationWeeks: "4", startDate: "", endDate: "",
    maxStudents: "40", hasFastTrack: false,
  });
  const [submitting, setSubmitting] = useState(false);

  // ── Module/Lesson state (fast track content) ──────────────────────────────
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [expandedModules, setExpandedModules] = useState({});
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [editModule, setEditModule] = useState(null);
  const [moduleForm, setModuleForm] = useState({ title: "", description: "" });
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [editLesson, setEditLesson] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [viewingLesson, setViewingLesson] = useState(null);
  const [lessonForm, setLessonForm] = useState({ title: "", description: "", contentType: "video", videoUrl: "", textContent: "", documentUrl: "", durationSeconds: 0, isFreePreview: false });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const durationTimer = useRef(null);

  // ── Confirm modal state ────────────────────────────────────────────────────
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmDestructive, setConfirmDestructive] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

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

  // ── Data loading ──────────────────────────────────────────────────────────
  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [courseRes, moduleRes, lessonRes] = await Promise.allSettled([
        api("/manage/courses/"),
        api("/manage/modules/"),
        api("/manage/lessons/"),
      ]);
      if (courseRes.status === "fulfilled") setCourses(courseRes.value.courses || []);
      if (moduleRes.status === "fulfilled") setModules(moduleRes.value.modules || []);
      if (lessonRes.status === "fulfilled") setLessons(lessonRes.value.lessons || []);
    } catch (err) {
      showMsg(err.message || "Failed to load data.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function reloadModulesAndLessons() {
    try {
      const [moduleRes, lessonRes] = await Promise.allSettled([
        api("/manage/modules/"),
        api("/manage/lessons/"),
      ]);
      if (moduleRes.status === "fulfilled") setModules(moduleRes.value.modules || []);
      if (lessonRes.status === "fulfilled") setLessons(lessonRes.value.lessons || []);
    } catch { /* ignore */ }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function getModulesForCourse(courseId) { return modules.filter((m) => m.courseId === courseId).sort((a, b) => a.order - b.order); }
  function getLessonsForModule(moduleId) { return lessons.filter((l) => l.moduleId === moduleId).sort((a, b) => a.order - b.order); }
  function getLessonsForCourse(courseId) {
    return lessons.filter((l) => { const mod = modules.find((m) => m.id === l.moduleId); return mod && mod.courseId === courseId; });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // COURSE CRUD
  // ══════════════════════════════════════════════════════════════════════════
  function startCreate() {
    setEditingCourse(null);
    setCourseForm({
      title: "", description: "", category: "", price: "",
      durationWeeks: "4", startDate: "", endDate: "",
      maxStudents: "40", hasFastTrack: false,
    });
    setShowCourseForm(true);
  }

  function startEdit(course) {
    setEditingCourse(course);
    setCourseForm({
      title: course.title, description: course.description, category: course.category,
      price: course.price, durationWeeks: String(course.durationWeeks),
      startDate: course.startDate || "", endDate: course.endDate || "",
      maxStudents: String(course.maxStudents), hasFastTrack: course.hasFastTrack,
    });
    setShowCourseForm(true);
  }

  async function handleCourseSubmit(e) {
    e.preventDefault();
    if (!courseForm.startDate || !courseForm.endDate) {
      showMsg("Start date and end date are required.", "error"); return;
    }
    if (new Date(courseForm.endDate) < new Date(courseForm.startDate)) {
      showMsg("End date must be after start date.", "error"); return;
    }
    setSubmitting(true);
    try {
      const body = {
        ...courseForm,
        price: parseFloat(courseForm.price) || 0,
        durationWeeks: parseInt(courseForm.durationWeeks) || 4,
        maxStudents: parseInt(courseForm.maxStudents) || 40,
      };
      if (editingCourse) {
        await api(`/manage/courses/${editingCourse.id}/`, { method: "PATCH", body });
      } else {
        await api("/manage/courses/", { method: "POST", body });
      }
      setShowCourseForm(false);
      loadAll();
    } catch (err) {
      showMsg(err.message || "Failed to save course.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteCourse(id) {
    openConfirm("Delete Course", "Are you sure you want to delete this course? This cannot be undone.", async () => {
      try {
        await api(`/manage/courses/${id}/`, { method: "DELETE" });
        if (selectedCourse?.id === id) { setSelectedCourse(null); setViewingLesson(null); }
        loadAll();
      } catch (err) {
        showMsg(err.message || "Failed to delete course.", "error");
      }
    }, true);
  }

  async function handlePayFastTrack() {
    try {
      const data = await api("/paystack/fast-track-init/", { method: "POST" });
      window.location.href = data.authorization_url;
    } catch (err) { showMsg(err.message || "Payment init failed.", "error"); }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MODULE CRUD
  // ══════════════════════════════════════════════════════════════════════════
  function toggleModule(id) { setExpandedModules((p) => ({ ...p, [id]: !p[id] })); }

  async function handleModuleSubmit(e) {
    e.preventDefault();
    try {
      if (editModule) {
        await api(`/manage/modules/${editModule.id}/`, { method: "PATCH", body: moduleForm });
      } else {
        await api("/manage/modules/", { method: "POST", body: { ...moduleForm, courseId: selectedCourse.id } });
      }
      setShowModuleForm(false); setEditModule(null); setModuleForm({ title: "", description: "" });
      const data = await api("/manage/modules/"); setModules(data.modules || []);
    } catch (err) { showMsg(err.message || "Failed to save module.", "error"); }
  }

  async function handleDeleteModule(id) {
    openConfirm("Delete Module", "Delete this module and all its lessons?", async () => {
      try {
        await api(`/manage/modules/${id}/`, { method: "DELETE" });
        setModules((p) => p.filter((m) => m.id !== id));
        setLessons((p) => p.filter((l) => l.moduleId !== id));
      } catch (err) { showMsg(err.message, "error"); }
    }, true);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // LESSON CRUD
  // ══════════════════════════════════════════════════════════════════════════
  function openLessonEdit(l) {
    setEditLesson(l);
    setLessonForm({ title: l.title, description: l.description || "", contentType: l.contentType, videoUrl: l.videoUrl || "", textContent: l.textContent || "", documentUrl: l.documentUrl || "", durationSeconds: l.durationSeconds || 0, isFreePreview: l.isFreePreview || false });
    setShowLessonForm(true);
  }

  function openLessonView(l) { setViewingLesson(l); }

  const fetchDuration = useCallback(async (url) => {
    if (!url || (!url.includes("youtube.com") && !url.includes("youtu.be"))) return;
    try { const data = await api("/manage/fetch-video-duration/", { method: "POST", body: { url } }); setLessonForm((p) => ({ ...p, durationSeconds: data.durationSeconds })); } catch { /* ignore */ }
  }, []);

  function handleUrlChange(value) {
    setLessonForm((p) => ({ ...p, videoUrl: value }));
    if (durationTimer.current) clearTimeout(durationTimer.current);
    durationTimer.current = setTimeout(() => fetchDuration(value), 800);
  }
  useEffect(() => () => { if (durationTimer.current) clearTimeout(durationTimer.current); }, []);

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const data = await api("/media/upload/", { method: "POST", body: formData });
      setLessonForm((p) => ({ ...p, videoUrl: data.url }));
    } catch (err) { showMsg(err.message || "Upload failed.", "error"); }
    finally { setUploadingFile(false); }
  }

  async function handleDocUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const data = await api("/media/upload/", { method: "POST", body: formData });
      setLessonForm((p) => ({ ...p, documentUrl: data.url }));
    } catch (err) { showMsg(err.message || "Upload failed.", "error"); }
    finally { setUploadingDoc(false); }
  }

  async function handleLessonSubmit(e) {
    e.preventDefault();
    try {
      if (editLesson) {
        await api(`/manage/lessons/${editLesson.id}/`, { method: "PATCH", body: lessonForm });
      } else {
        await api("/manage/lessons/", { method: "POST", body: { ...lessonForm, moduleId: selectedModule.id } });
      }
      setShowLessonForm(false); setEditLesson(null);
      setLessonForm({ title: "", description: "", contentType: "video", videoUrl: "", textContent: "", documentUrl: "", durationSeconds: 0, isFreePreview: false });
      if (viewingLesson) {
        const data = await api("/manage/lessons/");
        const updated = (data.lessons || []).find((l) => l.id === viewingLesson.id);
        if (updated) setViewingLesson(updated);
      } else {
        const data = await api("/manage/lessons/"); setLessons(data.lessons || []);
      }
    } catch (err) { showMsg(err.message || "Failed to save lesson.", "error"); }
  }

  async function handleDeleteLesson(id) {
    openConfirm("Delete Lesson", "Delete this lesson?", async () => {
      try { await api(`/manage/lessons/${id}/`, { method: "DELETE" }); setLessons((p) => p.filter((l) => l.id !== id)); } catch (err) { showMsg(err.message, "error"); }
    }, true);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  if (loading) return <div className="page-container"><p>Loading courses...</p></div>;

  // ── Module form modal ───────────────────────────────────────────────────
  const moduleFormModal = showModuleForm && (
    <div className="modal-overlay" onClick={() => { setShowModuleForm(false); setEditModule(null); }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0 }}>{editModule ? "Edit Module" : "New Module"}</h2>
          <button className="inline-message-close" onClick={() => { setShowModuleForm(false); setEditModule(null); }}><X size={18} /></button>
        </div>
        <form className="management-form" style={{ gridTemplateColumns: "1fr", background: "none", padding: 0, margin: 0 }} onSubmit={handleModuleSubmit}>
          <label>Module Title<input value={moduleForm.title} onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })} required /></label>
          <label>Description<textarea value={moduleForm.description} onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })} rows={2} /></label>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button className="primary-button" type="submit">{editModule ? "Update" : "Create"} Module</button>
            <button className="secondary-button" type="button" onClick={() => { setShowModuleForm(false); setEditModule(null); }}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );

  // ── Lesson form modal ───────────────────────────────────────────────────
  const lessonFormModal = showLessonForm && (
    <div className="modal-overlay" onClick={() => { setShowLessonForm(false); setEditLesson(null); }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0 }}>{editLesson ? "Edit Lesson" : "New Lesson"}</h2>
          <button className="inline-message-close" onClick={() => { setShowLessonForm(false); setEditLesson(null); }}><X size={18} /></button>
        </div>
        <form className="management-form" style={{ gridTemplateColumns: "1fr", background: "none", padding: 0, margin: 0 }} onSubmit={handleLessonSubmit}>
          <label>Content Type
            <select value={lessonForm.contentType} onChange={(e) => setLessonForm({ ...lessonForm, contentType: e.target.value })}>
              <option value="video">Video</option>
              <option value="text">Text</option>
              <option value="quiz">Quiz</option>
              <option value="document">Document</option>
            </select>
          </label>
          <label>Title<input value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} required /></label>
          <label>Description<textarea value={lessonForm.description} onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })} rows={2} /></label>
          {lessonForm.contentType === "video" && (
            <>
              <div style={{ display: "flex", gap: 12 }}>
                <label style={{ flex: 1 }}>Video URL<input value={lessonForm.videoUrl} onChange={(e) => handleUrlChange(e.target.value)} placeholder="YouTube URL" /></label>
                <div style={{ flex: 1 }}>
                  <span style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Upload Video</span>
                  <div className="file-upload-input">
                    <input type="file" id="video-file-upload" accept="video/*" onChange={handleFileUpload} disabled={uploadingFile} />
                    <label htmlFor="video-file-upload" className="file-upload-label"><Upload size={14} /> {uploadingFile ? "Uploading..." : "Choose File"}</label>
                    {lessonForm.videoUrl && !uploadingFile && <span className="file-upload-name">{lessonForm.videoUrl.split("/").pop()}</span>}
                  </div>
                </div>
              </div>
              {lessonForm.videoUrl && <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>Current: {lessonForm.videoUrl}</p>}
            </>
          )}
          {lessonForm.contentType === "text" && (
            <label>Text Content<textarea value={lessonForm.textContent} onChange={(e) => setLessonForm({ ...lessonForm, textContent: e.target.value })} rows={6} placeholder="Write lesson content here..." /></label>
          )}
          {lessonForm.contentType === "document" && (
            <>
              <div style={{ display: "flex", gap: 12 }}>
                <label style={{ flex: 1 }}>Document URL<input value={lessonForm.documentUrl} onChange={(e) => setLessonForm({ ...lessonForm, documentUrl: e.target.value })} placeholder="Link to document" /></label>
                <div style={{ flex: 1 }}>
                  <span style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Upload Document</span>
                  <div className="file-upload-input">
                    <input type="file" id="doc-file-upload" accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx" onChange={handleDocUpload} disabled={uploadingDoc} />
                    <label htmlFor="doc-file-upload" className="file-upload-label"><Upload size={14} /> {uploadingDoc ? "Uploading..." : "Choose File"}</label>
                    {lessonForm.documentUrl && !uploadingDoc && <span className="file-upload-name">{lessonForm.documentUrl.split("/").pop()}</span>}
                  </div>
                </div>
              </div>
              {lessonForm.documentUrl && <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>Current: {lessonForm.documentUrl}</p>}
            </>
          )}
          <label className="checkbox-label" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input type="checkbox" checked={lessonForm.isFreePreview} onChange={(e) => setLessonForm({ ...lessonForm, isFreePreview: e.target.checked })} />
            <span className="checkbox-custom" /> Free Preview
          </label>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button className="primary-button" type="submit">{editLesson ? "Update" : "Create"} Lesson</button>
            <button className="secondary-button" type="button" onClick={() => { setShowLessonForm(false); setEditLesson(null); }}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );

  // ── Lesson detail view ──────────────────────────────────────────────────
  if (!showModuleForm && !showLessonForm && viewingLesson) {
    return (
      <div className="page-container">
        <div className="page-header"><div><h1>My Courses</h1></div></div>
        {error && <div className={`inline-message inline-message--${messageType || "error"}`}>{error}<button type="button" className="inline-message-close" onClick={() => showMsg("")}><X size={16} /></button></div>}
        {moduleFormModal}
        {lessonFormModal}
        <ConfirmModal open={confirmOpen} title={confirmTitle} message={confirmMessage} destructive={confirmDestructive} onConfirm={handleConfirm} onCancel={() => setConfirmOpen(false)} />
        <div>
          <button className="back-link" onClick={() => setViewingLesson(null)} type="button"><ArrowLeft size={16} /> Back to modules</button>
          <div className="mod-card" style={{ marginTop: 16, cursor: "default" }}>
            <div style={{ padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div className="mod-card-icon" style={{ width: 42, height: 42 }}>
                  {(() => { const Ic = CONTENT_ICONS[viewingLesson.contentType] || FileText; return <Ic size={20} />; })()}
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: 0, fontSize: 20 }}>{viewingLesson.title}</h2>
                  <div style={{ display: "flex", gap: 8, marginTop: 6, alignItems: "center" }}>
                    <span className="ft-badge ft-badge-cat">{viewingLesson.contentType}</span>
                    {viewingLesson.contentType === "video" && <span style={{ fontSize: 13, color: "var(--muted)" }}><Clock size={13} style={{ verticalAlign: -2 }} /> {formatDuration(viewingLesson.durationSeconds)}</span>}
                    {viewingLesson.isFreePreview && <span className="ft-badge ft-badge-free">Free Preview</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="icon-action" onClick={() => { openLessonEdit(viewingLesson); setViewingLesson(null); }} title="Edit"><Edit size={16} /></button>
                  <button className="icon-action danger" onClick={() => { handleDeleteLesson(viewingLesson.id); setViewingLesson(null); }} title="Delete"><Trash2 size={16} /></button>
                </div>
              </div>
              {viewingLesson.description && <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 20px" }}>{viewingLesson.description}</p>}
              {viewingLesson.contentType === "video" && viewingLesson.videoUrl && (
                <div style={{ borderRadius: 12, overflow: "hidden", background: "#000", aspectRatio: "16/9", marginBottom: 20 }}>
                  {viewingLesson.videoUrl.includes("youtube.com") || viewingLesson.videoUrl.includes("youtu.be") ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${viewingLesson.videoUrl.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1] || ""}`}
                      style={{ width: "100%", height: "100%", border: 0 }}
                      allowFullScreen title={viewingLesson.title}
                    />
                  ) : (
                    <video src={viewingLesson.videoUrl} controls style={{ width: "100%", height: "100%" }} />
                  )}
                </div>
              )}
              {viewingLesson.contentType === "text" && viewingLesson.textContent && (
                <div style={{ padding: 20, background: "var(--surface-soft)", borderRadius: 10, fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {viewingLesson.textContent}
                </div>
              )}
              {viewingLesson.contentType === "document" && viewingLesson.documentUrl && (
                <a href={viewingLesson.documentUrl} target="_blank" rel="noopener noreferrer" className="primary-button" style={{ display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
                  <File size={16} /> View Document
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Course detail view (modules/lessons) ────────────────────────────────
  if (!showCourseForm && selectedCourse) {
    const cm = getModulesForCourse(selectedCourse.id);
    const lesCount = getLessonsForCourse(selectedCourse.id).length;
    return (
      <div className="page-container">
        <div className="page-header"><div><h1>My Courses</h1></div></div>
        {error && <div className={`inline-message inline-message--${messageType || "error"}`}>{error}<button type="button" className="inline-message-close" onClick={() => showMsg("")}><X size={16} /></button></div>}
        {moduleFormModal}
        {lessonFormModal}
        <ConfirmModal open={confirmOpen} title={confirmTitle} message={confirmMessage} destructive={confirmDestructive} onConfirm={handleConfirm} onCancel={() => setConfirmOpen(false)} />
        <div>
          <button className="back-link" onClick={() => { setSelectedCourse(null); setViewingLesson(null); }} type="button"><ArrowLeft size={16} /> Back to courses</button>
          <div className="ft-course-intro">
            <h2>{selectedCourse.title}</h2>
            {selectedCourse.description && <p className="ft-course-desc">{selectedCourse.description}</p>}
            <div className="ft-course-meta">
              {selectedCourse.category && <span className="ft-badge ft-badge-cat">{selectedCourse.category}</span>}
              <span className="ft-badge ft-badge-free">{cm.length} module{cm.length !== 1 ? "s" : ""}</span>
              <span className="ft-badge ft-badge-free">{lesCount} lesson{lesCount !== 1 ? "s" : ""}</span>
            </div>
          </div>

          {selectedCourse.hasFastTrack ? (
            <>
              <button className="primary-button" onClick={() => { setEditModule(null); setModuleForm({ title: "", description: "" }); setShowModuleForm(true); }} style={{ marginBottom: 16, display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Plus size={16} /> Add Module
              </button>
              {cm.length === 0 ? (
                <div className="empty-state"><p>No modules yet. Add your first module.</p></div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {cm.map((m) => {
                    const ml = getLessonsForModule(m.id);
                    const expanded = expandedModules[m.id] !== false;
                    return (
                      <div key={m.id} className="mod-card">
                        <div className="mod-card-header" onClick={() => toggleModule(m.id)}>
                          {expanded ? <ChevronDown size={18} style={{ color: "var(--muted)", flexShrink: 0 }} /> : <ChevronRight size={18} style={{ color: "var(--muted)", flexShrink: 0 }} />}
                          <div className="mod-card-icon"><Layers size={18} /></div>
                          <div className="mod-card-info">
                            <strong>{m.title}</strong>
                            <span>{ml.length} lesson{ml.length !== 1 ? "s" : ""}</span>
                          </div>
                          <div className="mod-card-actions" onClick={(e) => e.stopPropagation()}>
                            <button className="icon-action" onClick={() => { setEditModule(m); setModuleForm({ title: m.title, description: m.description || "" }); setShowModuleForm(true); }}><Edit size={15} /></button>
                            <button className="icon-action danger" onClick={() => handleDeleteModule(m.id)}><Trash2 size={15} /></button>
                            <button className="add-lesson-btn" onClick={() => { setSelectedModule(m); setEditLesson(null); setLessonForm({ title: "", description: "", contentType: "video", videoUrl: "", textContent: "", documentUrl: "", durationSeconds: 0, isFreePreview: false }); setShowLessonForm(true); }}><Plus size={14} /> Lesson</button>
                          </div>
                        </div>
                        {expanded && ml.length > 0 && (
                          <div className="mod-lessons">
                            {ml.map((l) => {
                              const Icon = CONTENT_ICONS[l.contentType] || FileText;
                              return (
                                <div key={l.id} className="mod-lesson-row" onClick={() => openLessonView(l)} style={{ cursor: "pointer" }}>
                                  <div className="mod-lesson-icon"><Icon size={15} /></div>
                                  <span className="mod-lesson-title">{l.title}</span>
                                  <div className="mod-lesson-meta">
                                    {l.contentType === "video" && <span>{formatDuration(l.durationSeconds)}</span>}
                                    {l.isFreePreview && <span className="ft-badge ft-badge-free" style={{ fontSize: 10, padding: "2px 6px" }}>Free</span>}
                                  </div>
                                  <div className="mod-lesson-actions" onClick={(e) => e.stopPropagation()}>
                                    <button className="icon-action" onClick={() => openLessonEdit(l)}><Edit size={13} /></button>
                                    <button className="icon-action danger" onClick={() => handleDeleteLesson(l.id)}><Trash2 size={13} /></button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="empty-state" style={{ marginTop: 20 }}>
              <Layers size={48} style={{ opacity: 0.3 }} />
              <p>Fast Track is not enabled for this course.</p>
              {user?.canUploadFastTrack ? (
                <button className="primary-button" onClick={async () => {
                  try {
                    await api(`/manage/courses/${selectedCourse.id}/`, { method: "PATCH", body: { hasFastTrack: true } });
                    setSelectedCourse({ ...selectedCourse, hasFastTrack: true });
                    loadAll();
                  } catch (err) { showMsg(err.message || "Failed to enable fast track.", "error"); }
                }} type="button">Enable Fast Track</button>
              ) : (
                <div>
                  <p style={{ fontSize: 14, color: "var(--muted)" }}>Pay &#8358;25,000 to enable fast track and add content to your courses.</p>
                  <button className="primary-button" onClick={handlePayFastTrack} type="button"><CreditCard size={16} /> Pay &#8358;25,000 to Enable Fast Track</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Course list view (default) ──────────────────────────────────────────
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <Link to="/app" className="back-link">&larr; Back to Dashboard</Link>
          <h1>My Courses</h1>
        </div>
        <button className="primary-button" onClick={startCreate}>+ Add Course</button>
      </div>

      {error && <div className={`inline-message inline-message--${messageType || "error"}`}>{error}<button type="button" className="inline-message-close" onClick={() => showMsg("")}><X size={16} /></button></div>}

      <ConfirmModal open={confirmOpen} title={confirmTitle} message={confirmMessage} destructive={confirmDestructive} onConfirm={handleConfirm} onCancel={() => setConfirmOpen(false)} />

      {showCourseForm && (
        <div className="modal-overlay" onClick={() => setShowCourseForm(false)}>
          <div className="modal-content modal-trainer-form" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingCourse ? "Edit Course" : "Create New Course"}</h2>
              <p>{editingCourse ? "Update your course details" : "Add a new course to start teaching"}</p>
            </div>
            <form onSubmit={handleCourseSubmit} style={{ display: "block", padding: "24px 32px 28px" }}>
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px", color: "var(--heading)", margin: "0 0 14px", paddingBottom: 8, borderBottom: "2px solid var(--border)" }}>Course Details</h3>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600, color: "var(--heading)" }}>Course Title *</label>
                  <input style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 14, background: "var(--bg)", color: "var(--text)" }} placeholder="e.g. Web Development Fundamentals" value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} required />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600, color: "var(--heading)" }}>Description</label>
                  <textarea style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 14, background: "var(--bg)", color: "var(--text)", resize: "vertical", minHeight: 80 }} placeholder="Brief description of the course content" value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} rows={4} />
                </div>
                <div style={{ marginTop: 14 }}>
                  <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600, color: "var(--heading)" }}>Skill Area / Category</label>
                  <select style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 14, background: "var(--bg)", color: "var(--text)" }} value={courseForm.category} onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}>
                    <option value="">Select category</option>
                    {["Creative Industry", "Automobile", "Construction", "Agro-Allied", "Delivery & Logistics", "Culinary & Catering", "Cleaning Services", "Green Energy", "Satellite & Security Technology", "ICT", "Cosmetology", "Education"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px", color: "var(--heading)", margin: "0 0 14px", paddingBottom: 8, borderBottom: "2px solid var(--border)" }}>Pricing &amp; Duration</h3>
                <div className="form-grid-2">
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600, color: "var(--heading)" }}>Price (&#8358;)</label>
                    <input type="number" style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 14, background: "var(--bg)", color: "var(--text)" }} value={courseForm.price} onChange={(e) => setCourseForm({ ...courseForm, price: e.target.value })} min="0" step="0.01" />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600, color: "var(--heading)" }}>Duration (weeks)</label>
                    <input type="number" style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 14, background: "var(--bg)", color: "var(--text)" }} value={courseForm.durationWeeks} onChange={(e) => setCourseForm({ ...courseForm, durationWeeks: e.target.value })} min="1" />
                  </div>
                </div>
                <div className="form-grid-2">
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600, color: "var(--heading)" }}>Start Date</label>
                    <input type="date" required style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 14, background: "var(--bg)", color: "var(--text)" }} value={courseForm.startDate} onChange={(e) => setCourseForm({ ...courseForm, startDate: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600, color: "var(--heading)" }}>End Date</label>
                    <input type="date" required style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 14, background: "var(--bg)", color: "var(--text)" }} value={courseForm.endDate} onChange={(e) => setCourseForm({ ...courseForm, endDate: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600, color: "var(--heading)" }}>Max Students</label>
                  <input type="number" style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 14, background: "var(--bg)", color: "var(--text)" }} value={courseForm.maxStudents} onChange={(e) => setCourseForm({ ...courseForm, maxStudents: e.target.value })} min="1" />
                </div>
              </div>
              {user?.canUploadFastTrack && (
                <div style={{ marginBottom: 24 }}>
                  <label className="checkbox-label">
                    <input type="checkbox" checked={courseForm.hasFastTrack} onChange={(e) => setCourseForm({ ...courseForm, hasFastTrack: e.target.checked })} />
                    <span className="checkbox-custom" />
                    Enable Fast Track Course
                  </label>
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="outline-button" onClick={() => setShowCourseForm(false)}>Cancel</button>
                <button className="primary-button" disabled={submitting}>{submitting ? "Saving..." : "Save Course"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="courses-grid">
        {courses.map((course) => {
          const modCount = getModulesForCourse(course.id).length;
          const lesCount = getLessonsForCourse(course.id).length;
          return (
            <div key={course.id} className={`course-card ${course.isRestricted ? "restricted" : ""}`} onClick={() => setSelectedCourse(course)} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setSelectedCourse(course)} style={{ cursor: "pointer" }}>
              <h3>{course.title}</h3>
              <p className="course-meta">TRAINER: {course.trainerName || user?.fullName || "—"}</p>
              <div className="course-tags">
                <span className={`status-badge ${course.isActive ? "active" : "inactive"}`}>{course.isActive ? "Active" : "Inactive"}</span>
                {course.isRestricted && <span className="status-badge restricted">Restricted</span>}
                <span>&#8358;{course.price}</span>
                <span>{course.durationWeeks} weeks</span>
                {course.hasFastTrack && <span className="fast-track-badge">Fast Track</span>}
              </div>
              {course.hasFastTrack && (
                <div style={{ marginTop: 8, fontSize: 12, color: "var(--muted)" }}>
                  {modCount} module{modCount !== 1 ? "s" : ""} &middot; {lesCount} lesson{lesCount !== 1 ? "s" : ""}
                </div>
              )}
              <div className="course-actions" onClick={(e) => e.stopPropagation()}>
                <button className="outline-button" onClick={() => startEdit(course)}>Edit</button>
                <button className="danger-button" onClick={() => deleteCourse(course.id)}>Delete</button>
              </div>
            </div>
          );
        })}
      </div>

      {courses.length === 0 && (
        <div className="empty-state"><p>No courses yet. Create your first course to start teaching!</p></div>
      )}
    </div>
  );
}
