import { Edit, Camera, User, Briefcase, MapPin, FileText, Shield, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

import { useAuth } from "../lib/auth.jsx";

const AUTH_LABELS = { pending: "Pending Review", approved: "Approved", restricted: "Restricted" };

export default function Profile() {
  const { user } = useAuth();
  const isTrainer = user?.role === "trainer";
  const isCorpsMember = user?.role === "corps_member";
  const isAdmin = user?.role === "saed_admin" || user?.role === "dunis_admin";

  return (
    <div className="page-container">
      <Link className="back-link" to="/app/dashboard"><ArrowLeft size={16} /> Back to Dashboard</Link>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Profile</h1>
        <Link to="/app/edit-profile" className="primary-button" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Edit size={16} /> Edit Profile
        </Link>
      </div>

      <section className="edit-profile-panel">
        <div className="edit-profile-avatar-section">
          <div className="edit-profile-avatar">
            {user?.profilePicture ? (
              <img src={user.profilePicture} alt="Profile" />
            ) : (
              <Camera size={32} />
            )}
          </div>
          <h2 style={{ margin: 0, fontSize: 20 }}>{user?.fullName || user?.username}</h2>
          <span className="role-badge" style={{ textTransform: "capitalize" }}>{user?.role?.replace("_", " ")}</span>
        </div>

        <div className="edit-profile-section">
          <h3><User size={16} /> Personal Information</h3>
          <div className="edit-profile-grid">
            <div>
              <span className="label-hint">Full Name</span>
              <p style={{ margin: "4px 0 0", fontWeight: 600 }}>{user?.fullName || "—"}</p>
            </div>
            <div>
              <span className="label-hint">Email</span>
              <p style={{ margin: "4px 0 0", fontWeight: 600 }}>{user?.email || "—"}</p>
            </div>
            <div>
              <span className="label-hint">Phone</span>
              <p style={{ margin: "4px 0 0", fontWeight: 600 }}>{user?.phone || "—"}</p>
            </div>
            <div>
              <span className="label-hint">State Code</span>
              <p style={{ margin: "4px 0 0", fontWeight: 600 }}>{user?.nyscStateCode || "—"}</p>
            </div>
          </div>
        </div>

        {isCorpsMember && (
          <div className="edit-profile-section">
            <h3><MapPin size={16} /> Location & Skills</h3>
            <div className="edit-profile-grid">
              <div>
                <span className="label-hint">LGA of Deployment</span>
                <p style={{ margin: "4px 0 0", fontWeight: 600 }}>{user?.lgaOfDeployment || "—"}</p>
              </div>
              <div>
                <span className="label-hint">State of Deployment</span>
                <p style={{ margin: "4px 0 0", fontWeight: 600 }}>{user?.stateOfDeployment || "—"}</p>
              </div>
              <div>
                <span className="label-hint">State of Origin</span>
                <p style={{ margin: "4px 0 0", fontWeight: 600 }}>{user?.stateOfOrigin || "—"}</p>
              </div>
            </div>
            {user?.skillInterests?.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <span className="label-hint">Skill Interests</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                  {user.skillInterests.map((s) => (
                    <span key={s} className="skill-chip selected" style={{ cursor: "default" }}>{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {isTrainer && (
          <>
            <div className="edit-profile-section">
              <h3><Briefcase size={16} /> Professional Details</h3>
              <div className="edit-profile-grid">
                <div>
                  <span className="label-hint">Specialization</span>
                  <p style={{ margin: "4px 0 0", fontWeight: 600 }}>{user?.specialization || "—"}</p>
                </div>
                <div>
                  <span className="label-hint">Years of Experience</span>
                  <p style={{ margin: "4px 0 0", fontWeight: 600 }}>{user?.yearsExperience || "—"}</p>
                </div>
                <div>
                  <span className="label-hint">Company Name</span>
                  <p style={{ margin: "4px 0 0", fontWeight: 600 }}>{user?.companyName || "—"}</p>
                </div>
              </div>
              {user?.bio && (
                <div style={{ marginTop: 12 }}>
                  <span className="label-hint">Bio</span>
                  <p style={{ margin: "4px 0 0", fontWeight: 500, lineHeight: 1.6 }}>{user.bio}</p>
                </div>
              )}
            </div>

            <div className="edit-profile-section">
              <h3><MapPin size={16} /> Partner LGAs</h3>
              {user?.partnerLgas?.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {user.partnerLgas.map((l) => (
                    <span key={l} className="skill-chip selected" style={{ cursor: "default" }}>{l}</span>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, color: "var(--muted)" }}>No partner LGAs set.</p>
              )}
            </div>

            <div className="edit-profile-section">
              <h3><FileText size={16} /> Documents</h3>
              {user?.partnershipLetter ? (
                <a href={user.partnershipLetter} target="_blank" rel="noopener noreferrer" className="primary-button" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <FileText size={14} /> View Partnership Letter
                </a>
              ) : (
                <p style={{ margin: 0, color: "var(--muted)" }}>No partnership letter uploaded.</p>
              )}
            </div>
          </>
        )}

        {!isAdmin && (
          <div className="edit-profile-section">
            <h3><Shield size={16} /> Account Status</h3>
            <div className="edit-profile-grid">
              <div>
                <span className="label-hint">Account Active</span>
                <p style={{ margin: "4px 0 0", fontWeight: 600 }}>{user?.isActive ? "Yes" : "No"}</p>
              </div>
              {isTrainer && (
                <>
                  <div>
                    <span className="label-hint">Authorization</span>
                    <p style={{ margin: "4px 0 0", fontWeight: 600 }}>{AUTH_LABELS[user?.authorizationStatus] || "Pending"}</p>
                  </div>
                  <div>
                    <span className="label-hint">Payment Verified</span>
                    <p style={{ margin: "4px 0 0", fontWeight: 600 }}>{user?.paymentVerified ? "Yes" : "No"}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {isAdmin && (
          <div className="edit-profile-section">
            <h3><Shield size={16} /> Admin Info</h3>
            <div className="edit-profile-grid">
              <div>
                <span className="label-hint">Role</span>
                <p style={{ margin: "4px 0 0", fontWeight: 600, textTransform: "capitalize" }}>{user?.role?.replace("_", " ")}</p>
              </div>
              <div>
                <span className="label-hint">Email Verified</span>
                <p style={{ margin: "4px 0 0", fontWeight: 600 }}>{user?.isEmailVerified ? "Yes" : "No"}</p>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
