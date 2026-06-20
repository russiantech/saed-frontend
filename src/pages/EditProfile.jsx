import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, X, Camera, User, Briefcase, MapPin, FileText, Image } from "lucide-react";

import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";
import { LAGOS_LGAS } from "../data/nigerianStates.js";

const SKILL_AREAS = [
  "Creative Industry", "Automobile", "Construction", "Agro-Allied",
  "Delivery & Logistics", "Culinary & Catering", "Cleaning Services",
  "Green Energy", "Satellite & Security Technology", "ICT", "Cosmetology", "Education",
];

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const isTrainer = user?.role === "trainer";
  const isCorpsMember = user?.role === "corps_member";

  const [form, setForm] = useState({
    fullName: user?.fullName || "",
    phone: user?.phone || "",
    skillInterest: user?.skillInterest || "",
    skillInterests: user?.skillInterests || (user?.skillInterest ? [user.skillInterest] : []),
    lgaOfDeployment: user?.lgaOfDeployment || "",
    partnerLgas: user?.partnerLgas || [],
    bio: user?.bio || "",
    companyName: user?.companyName || "",
    yearsExperience: user?.yearsExperience || "",
  });

  useEffect(() => {
    if (!user) return;
    setForm({
      fullName: user.fullName || "",
      phone: user.phone || "",
      skillInterest: user.specialization || user.skillInterest || "",
      skillInterests: user.skillInterests || (user.skillInterest ? [user.skillInterest] : []),
      lgaOfDeployment: user.lgaOfDeployment || "",
      partnerLgas: user.partnerLgas || [],
      bio: user.bio || "",
      companyName: user.companyName || "",
      yearsExperience: user.yearsExperience || "",
    });
  }, [user]);
  const [profilePicture, setProfilePicture] = useState(null);
  const [partnershipLetter, setPartnershipLetter] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const photoMenuRef = useRef(null);
  const galleryInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }

  const openCamera = useCallback(async () => {
    setShowPhotoMenu(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      setShowCamera(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      });
    } catch (err) {
      alert("Could not access camera. Please check your browser permissions.");
    }
  }, []);

  function capturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
        setProfilePicture(file);
      }
      stopCamera();
      setShowCamera(false);
    }, "image/jpeg", 0.9);
  }

  function closeCamera() {
    stopCamera();
    setShowCamera(false);
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (photoMenuRef.current && !photoMenuRef.current.contains(e.target)) {
        setShowPhotoMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => { document.removeEventListener("mousedown", handleClickOutside); stopCamera(); };
  }, []);

  function update(key, value) {
    setForm((c) => ({ ...c, [key]: value }));
  }

  function toggleSkill(skill) {
    setForm((c) => {
      const current = c.skillInterests || [];
      const next = current.includes(skill) ? current.filter((s) => s !== skill) : [...current, skill];
      return { ...c, skillInterests: next, skillInterest: next[0] || "" };
    });
  }

  function toggleLga(lga) {
    setForm((c) => ({
      ...c,
      partnerLgas: c.partnerLgas.includes(lga)
        ? c.partnerLgas.filter((l) => l !== lga)
        : [...c.partnerLgas, lga],
    }));
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setMessageType("");
    try {
      const formData = new FormData();
      formData.append("fullName", form.fullName);
      formData.append("phone", form.phone);
      formData.append("skillInterest", form.skillInterest);
      formData.append("skillInterests", JSON.stringify(form.skillInterests));
      if (isTrainer) {
        formData.append("partnerLgas", JSON.stringify(form.partnerLgas));
        formData.append("bio", form.bio);
        formData.append("companyName", form.companyName);
        formData.append("yearsExperience", form.yearsExperience);
      }
      if (isCorpsMember) {
        formData.append("lgaOfDeployment", form.lgaOfDeployment);
      }
      if (profilePicture) {
        formData.append("profilePicture", profilePicture);
      }
      if (partnershipLetter) {
        formData.append("partnershipLetter", partnershipLetter);
      }
      const data = await api("/auth/update-profile/", { method: "PATCH", body: formData });
      if (data.user) setUser(data.user);
      navigate("/app/profile", { replace: true });
    } catch (err) {
      setMessage(err.message || "Failed to update profile.");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-container">
      <Link className="back-link" to="/app/profile"><ArrowLeft size={16} /> Back to Profile</Link>
      <div className="page-header">
        <h1>Edit Profile</h1>
      </div>

      {message && (
        <div className={`inline-message inline-message--${messageType || "error"}`}>
          {message}
          <button type="button" className="inline-message-close" onClick={() => { setMessage(""); setMessageType(""); }}><X size={16} /></button>
        </div>
      )}

      <section className="edit-profile-panel">
        <form className="edit-profile-form" onSubmit={save}>
          <div className="edit-profile-avatar-section">
            <div className="edit-profile-avatar">
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt="Profile" />
              ) : (
                <Camera size={32} />
              )}
            </div>
            <div className="edit-photo-menu-wrap" ref={photoMenuRef}>
              <button type="button" className="edit-profile-upload-btn" onClick={() => setShowPhotoMenu((p) => !p)}>
                <Camera size={14} /> Upload Photo
              </button>
              {showPhotoMenu && (
                <div className="edit-photo-menu">
                  <button type="button" className="edit-photo-option" onClick={openCamera}>
                    <Camera size={16} /> Take Photo
                  </button>
                  <button type="button" className="edit-photo-option" onClick={() => { galleryInputRef.current?.click(); setShowPhotoMenu(false); }}>
                    <Image size={16} /> Choose from Photos
                  </button>
                </div>
              )}
            </div>
            <input ref={galleryInputRef} type="file" accept="image/*" hidden onChange={(e) => { setProfilePicture(e.target.files?.[0] || null); e.target.value = ""; }} />
            {profilePicture && <span className="form-hint">{profilePicture.name}</span>}
          </div>

          <div className="edit-profile-section">
            <h3><User size={16} /> Personal Information</h3>
            <div className="edit-profile-grid">
              <label>Full Name *
                <input value={form.fullName} onChange={(e) => update("fullName", e.target.value)} required />
              </label>
              <label>Phone
                <input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="08012345678" />
              </label>
            </div>
          </div>

          {isCorpsMember && (
            <div className="edit-profile-section">
              <h3><MapPin size={16} /> Location & Skills</h3>
              <label>Skill Interests * <span className="label-hint">(select one or more)</span>
                <div className="skill-checkbox-grid">
                  {SKILL_AREAS.map((s) => (
                    <label key={s} className={`skill-chip ${form.skillInterests.includes(s) ? "selected" : ""}`}>
                      <input type="checkbox" checked={form.skillInterests.includes(s)} onChange={() => toggleSkill(s)} />
                      <span className="checkbox-custom" />
                      {s}
                    </label>
                  ))}
                </div>
              </label>
              <label>LGA of Deployment *
                <select value={form.lgaOfDeployment} onChange={(e) => update("lgaOfDeployment", e.target.value)} required>
                  <option value="">-- Select LGA --</option>
                  {LAGOS_LGAS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </label>
            </div>
          )}

          {isTrainer && (
            <>
              <div className="edit-profile-section">
                <h3><Briefcase size={16} /> Professional Details</h3>
                <div className="edit-profile-grid">
                  <label>Specialization
                    <select value={form.skillInterest} onChange={(e) => update("skillInterest", e.target.value)}>
                      <option value="">-- Select Specialization --</option>
                      {SKILL_AREAS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </label>
                  <label>Years of Experience
                    <input type="number" min="0" max="50" value={form.yearsExperience} onChange={(e) => update("yearsExperience", e.target.value)} placeholder="e.g. 5" />
                  </label>
                </div>
                <label>Company Name
                  <input value={form.companyName} onChange={(e) => update("companyName", e.target.value)} placeholder="Your company" />
                </label>
                <label>Bio
                  <textarea value={form.bio} onChange={(e) => update("bio", e.target.value)} placeholder="Tell us about yourself" rows={3} />
                </label>
              </div>

              <div className="edit-profile-section">
                <h3><MapPin size={16} /> Partner LGAs</h3>
                <label className="label-hint-block">Select the LGAs you cover *</label>
                <div className="skill-checkbox-grid">
                  {LAGOS_LGAS.map((l) => (
                    <label key={l} className={`skill-chip ${form.partnerLgas.includes(l) ? "selected" : ""}`}>
                      <input type="checkbox" checked={form.partnerLgas.includes(l)} onChange={() => toggleLga(l)} />
                      <span className="checkbox-custom" />
                      {l}
                    </label>
                  ))}
                </div>
              </div>

              <div className="edit-profile-section">
                <h3><FileText size={16} /> Documents</h3>
                <label>Partnership / Approval Letter
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setPartnershipLetter(e.target.files?.[0] || null)} />
                </label>
                {partnershipLetter && <span className="form-hint">{partnershipLetter.name}</span>}
                {user?.partnershipLetter && !partnershipLetter && (
                  <span className="form-hint">Current: <a href={user.partnershipLetter} target="_blank" rel="noopener noreferrer">View uploaded letter</a></span>
                )}
              </div>
            </>
          )}

          {!isCorpsMember && !isTrainer && (
            <p style={{ color: "var(--muted)" }}>No additional profile fields for your role.</p>
          )}

          <button className="edit-profile-save-btn" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </section>

      {showCamera && (
        <div className="camera-modal-overlay" onClick={closeCamera}>
          <div className="camera-modal" onClick={(e) => e.stopPropagation()}>
            <div className="camera-modal-header">
              <h3>Take Photo</h3>
              <button type="button" className="camera-modal-close" onClick={closeCamera}><X size={20} /></button>
            </div>
            <div className="camera-modal-body">
              <video ref={videoRef} autoPlay playsInline muted className="camera-video" />
              <canvas ref={canvasRef} style={{ display: "none" }} />
            </div>
            <div className="camera-modal-footer">
              <button type="button" className="primary-button" onClick={capturePhoto}>
                <Camera size={16} /> Capture
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
