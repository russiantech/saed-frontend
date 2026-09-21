import { Video, Plus, Trash2, Edit, X, ArrowLeft, BookOpen, Clock, Play, FileText, File, HelpCircle, ChevronDown, ChevronRight, Layers, Upload } from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";

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

export default function FastTrackVideos() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [messageType, setMessageType] = useState("");
  const [activeTab, setActiveTab] = useState("courses");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [editModule, setEditModule] = useState(null);
  const [moduleForm, setModuleForm] = useState({ title: "", description: "" });
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [editLesson, setEditLesson] = useState(null);
  const [lessonForm, setLessonForm] = useState({ title: "", description: "", contentType: "video", videoUrl: "", textContent: "", documentUrl: "", durationSeconds: 0, isFreePreview: false });
  const [uploadingFile, setUploadingFile] = useState(false);
  const durationTimer = useRef(null);
  const [expandedModules, setExpandedModules] = useState({});

  function showMsg(text, type) { setError(text); setMessageType(type || ""); }

  async function loadAll() {
    setLoading(true);
    try {
      const [courseRes, moduleRes, lessonRes] = await Promise.allSettled([
        api("/manage/courses/"),
        api("/manage/modules/"),
        api("/manage/lessons/"),
      ]);
      if (courseRes.status === "fulfilled") {
        setCourses((courseRes.value.courses || []).filter((c) => c.hasFastTrack));
      }
      if (moduleRes.status === "fulfilled") setModules(moduleRes.value.modules || []);
      if (lessonRes.status === "fulfilled") setLessons(lessonRes.value.lessons || []);
    } catch (err) {
      showMsg(err.message || "Failed to load data.", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  async function handlePayFastTrack() {
    try { const data = await api("/paystack/fast-track-init/", { method: "POST" }); window.location.href = data.authorization_url; } catch (err) { showMsg(err.message || "Payment init failed.", "error"); }
  }

  const fetchDuration = useCallback(async (url) => {
    if (!url || !url.includes("youtube.com") && !url.includes("youtu.be")) return;
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
    } catch (err) {
      showMsg(err.message || "Upload failed.", "error");
    } finally {
      setUploadingFile(false);
    }
  }

  function toggleModule(id) { setExpandedModules((p) => ({ ...p, [id]: !p[id] })); }

  function getModulesForCourse(courseId) { return modules.filter((m) => m.courseId === courseId).sort((a, b) => a.order - b.order); }
  function getLessonsForModule(moduleId) { return lessons.filter((l) => l.moduleId === moduleId).sort((a, b) => a.order - b.order); }
  function getLessonsForCourse(courseId) { return lessons.filter((l) => { const mod = modules.find((m) => m.id === l.moduleId); return mod && mod.courseId === courseId; }); }

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
    if (!window.confirm("Delete this module and all its lessons?")) return;
    try { await api(`/manage/modules/${id}/`, { method: "DELETE" }); setModules((p) => p.filter((m) => m.id !== id)); setLessons((p) => p.filter((l) => l.moduleId !== id)); } catch (err) { showMsg(err.message, "error"); }
  }

  async function handleLessonSubmit(e) {
    e.preventDefault();
    try {
      if (editLesson) {
        await api(`/manage/lessons/${editLesson.id}/`, { method: "PATCH", body: lessonForm });
      } else {
        await api("/manage/lessons/", { method: "POST", body: { ...lessonForm, moduleId: selectedModule.id } });
      }
      setShowLessonForm(false); setEditLesson(null); setLessonForm({ title: "", description: "", contentType: "video", videoUrl: "", textContent: "", documentUrl: "", durationSeconds: 0, isFreePreview: false });
      const data = await api("/manage/lessons/"); setLessons(data.lessons || []);
    } catch (err) { showMsg(err.message || "Failed to save lesson.", "error"); }
  }

  async function handleDeleteLesson(id) {
    if (!window.confirm("Delete this lesson?")) return;
    try { await api(`/manage/lessons/${id}/`, { method: "DELETE" }); setLessons((p) => p.filter((l) => l.id !== id)); } catch (err) { showMsg(err.message, "error"); }
  }

  if (loading) return <div className="empty-state">Loading...</div>;

  if (!user?.canUploadFastTrack) {
    return (
      <div className="page-container">
        <div className="page-header"><div><h1><Video size={24} /> Fast Track</h1><p>Enable fast track to upload content for your courses</p></div></div>
        <div className="empty-state">
          <p>Fast track is not enabled yet. Pay ₦25,000 to enable it.</p>
          <button className="primary-button" onClick={handlePayFastTrack} type="button"><CreditCard size={16} /> Pay ₦25,000 to Enable Fast Track</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header"><div><h1><Video size={24} /> Fast Track Courses</h1><p>Manage modules, lessons, and enrollments</p></div></div>

      {error && (
        <div className={`inline-message inline-message--${messageType || "error"}`}>
          {error}<button type="button" className="inline-message-close" onClick={() => showMsg("")}><X size={16} /></button>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <button type="button" className={activeTab === "courses" ? "primary-button" : "secondary-button"} onClick={() => setActiveTab("courses")}><BookOpen size={14} /> My Courses</button>
      </div>

      {showModuleForm && (
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
      )}

      {showLessonForm && (
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
                        <label htmlFor="video-file-upload" className="file-upload-label">
                          <Upload size={14} /> {uploadingFile ? "Uploading..." : "Choose File"}
                        </label>
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
                <label>Document URL<input value={lessonForm.documentUrl} onChange={(e) => setLessonForm({ ...lessonForm, documentUrl: e.target.value })} placeholder="Link to document" /></label>
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
      )}

      {!showModuleForm && !showLessonForm && selectedModule ? (
        <div>
          <button className="back-link" onClick={() => setSelectedModule(null)} type="button"><ArrowLeft size={16} /> Back to modules</button>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16, marginBottom: 16 }}>
            <h2 style={{ margin: 0 }}>{selectedModule.title} <span style={{ fontWeight: 400, color: "var(--muted)", fontSize: 16 }}>&mdash; Lessons</span></h2>
            <button className="primary-button" onClick={() => { setEditLesson(null); setLessonForm({ title: "", description: "", contentType: "video", videoUrl: "", textContent: "", documentUrl: "", durationSeconds: 0, isFreePreview: false }); setShowLessonForm(true); }} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Plus size={16} /> Add Lesson
            </button>
          </div>
          {(() => {
            const ml = getLessonsForModule(selectedModule.id);
            return ml.length === 0 ? <div className="empty-state"><p>No lessons yet. Add your first lesson.</p></div> : (
              <div className="mod-card" style={{ cursor: "default" }}>
                {ml.map((l, idx) => {
                  const Icon = CONTENT_ICONS[l.contentType] || FileText;
                  const thumb = l.contentType === "video" ? getVideoThumbnail(l.videoUrl) : null;
                  return (
                    <div key={l.id} className="mod-lesson-row" style={{ padding: "14px 20px" }}>
                      {thumb ? (
                        <div style={{ width: 56, height: 36, borderRadius: 6, overflow: "hidden", flexShrink: 0, background: "var(--surface-soft)" }}>
                          <img src={thumb} alt={l.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                      ) : (
                        <div className="mod-lesson-icon"><Icon size={16} /></div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="mod-lesson-title">{l.title}</div>
                        {l.description && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.description}</div>}
                      </div>
                      <div className="mod-lesson-meta">
                        {l.contentType === "video" && <span><Clock size={12} /> {formatDuration(l.durationSeconds)}</span>}
                        <span className="ft-badge ft-badge-cat" style={{ fontSize: 11 }}>{l.contentType}</span>
                        {l.isFreePreview && <span className="ft-badge ft-badge-free" style={{ fontSize: 10, padding: "2px 6px" }}>Free</span>}
                      </div>
                      <div className="mod-lesson-actions">
                        <button className="icon-action" onClick={() => { setEditLesson(l); setLessonForm({ title: l.title, description: l.description || "", contentType: l.contentType, videoUrl: l.videoUrl || "", textContent: l.textContent || "", documentUrl: l.documentUrl || "", durationSeconds: l.durationSeconds || 0, isFreePreview: l.isFreePreview || false }); setShowLessonForm(true); }}><Edit size={14} /></button>
                        <button className="icon-action danger" onClick={() => handleDeleteLesson(l.id)}><Trash2 size={14} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      ) : selectedCourse ? (
        <div>
          <button className="back-link" onClick={() => { setSelectedCourse(null); setSelectedModule(null); }} type="button"><ArrowLeft size={16} /> Back to courses</button>
          <div className="ft-course-intro">
            <h2>{selectedCourse.title}</h2>
            {selectedCourse.description && <p className="ft-course-desc">{selectedCourse.description}</p>}
            <div className="ft-course-meta">
              {selectedCourse.category && <span className="ft-badge ft-badge-cat">{selectedCourse.category}</span>}
              <span className="ft-badge ft-badge-free">{getModulesForCourse(selectedCourse.id).length} modules</span>
              <span className="ft-badge ft-badge-free">{getLessonsForCourse(selectedCourse.id).length} lessons</span>
            </div>
          </div>
          <button className="primary-button" onClick={() => { setEditModule(null); setModuleForm({ title: "", description: "" }); setShowModuleForm(true); }} style={{ marginBottom: 16, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Plus size={16} /> Add Module
          </button>
          {(() => {
            const cm = getModulesForCourse(selectedCourse.id);
            return cm.length === 0 ? <div className="empty-state"><p>No modules yet. Add your first module.</p></div> : (
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
                          <button className="add-lesson-btn" onClick={() => setSelectedModule(m)}><Plus size={14} /> Lesson</button>
                        </div>
                      </div>
                      {expanded && ml.length > 0 && (
                        <div className="mod-lessons">
                          {ml.map((l) => {
                            const Icon = CONTENT_ICONS[l.contentType] || FileText;
                            return (
                              <div key={l.id} className="mod-lesson-row">
                                <div className="mod-lesson-icon"><Icon size={15} /></div>
                                <span className="mod-lesson-title">{l.title}</span>
                                <div className="mod-lesson-meta">
                                  {l.contentType === "video" && <span>{formatDuration(l.durationSeconds)}</span>}
                                  {l.isFreePreview && <span className="ft-badge ft-badge-free" style={{ fontSize: 10, padding: "2px 6px" }}>Free</span>}
                                </div>
                                <div className="mod-lesson-actions">
                                  <button className="icon-action" onClick={() => { setEditLesson(l); setLessonForm({ title: l.title, description: l.description || "", contentType: l.contentType, videoUrl: l.videoUrl || "", textContent: l.textContent || "", documentUrl: l.documentUrl || "", durationSeconds: l.durationSeconds || 0, isFreePreview: l.isFreePreview || false }); setShowLessonForm(true); }}><Edit size={13} /></button>
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
            );
          })()}
        </div>
      ) : courses.length === 0 ? (
        <div className="empty-state"><BookOpen size={48} style={{ opacity: 0.3 }} /><p>No courses with fast track enabled.</p></div>
      ) : (
        <div className="ft-courses-grid">
          {courses.map((course) => {
            const modCount = getModulesForCourse(course.id).length;
            const lesCount = getLessonsForCourse(course.id).length;
            return (
              <div key={course.id} className="ft-course-card" onClick={() => setSelectedCourse(course)} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setSelectedCourse(course)}>
                <div className="ft-course-card-header">
                  <div className="ft-course-card-icon"><BookOpen size={22} /></div>
                  <div><h3>{course.title}</h3></div>
                </div>
                {course.description && <p className="ft-course-card-desc">{course.description}</p>}
                <div className="ft-course-card-footer">
                  <span className="ft-badge ft-badge-free">{modCount} module{modCount !== 1 ? "s" : ""} &middot; {lesCount} lesson{lesCount !== 1 ? "s" : ""}</span>
                  <span className="ft-view-link">Manage <Play size={12} /></span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
