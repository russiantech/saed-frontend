import { X } from "lucide-react";

export default function ConfirmModal({ open, title, message, onConfirm, onCancel, destructive }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: 24, maxWidth: 400 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>{title}</h2>
          <button className="inline-message-close" onClick={onCancel}><X size={18} /></button>
        </div>
        <p style={{ margin: "0 0 20px", fontSize: 14, lineHeight: 1.6, color: "var(--muted)" }}>{message}</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="secondary-button" onClick={onCancel}>Cancel</button>
          <button
            className={destructive ? "danger-button" : "primary-button"}
            onClick={onConfirm}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
