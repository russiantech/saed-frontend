import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Eye, FileText, Maximize2, Trash2, Upload } from "lucide-react";

import DocumentViewer, { LazyDocumentModal as DocumentModal } from "components/ui/LazyDocumentViewer.jsx";
import "styles/viewer.css";

export const LETTER_ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp";
const OK_EXT = /\.(pdf|jpe?g|png|webp)$/i;
const MAX_BYTES = 10 * 1024 * 1024;

export function validateLetter(file) {
  if (!file) return "";
  if (!OK_EXT.test(file.name)) return "Upload a PDF or an image (JPG, PNG, WebP).";
  if (file.size === 0 || file.size > MAX_BYTES) return "The file must be between 1 byte and 10 MB.";
  return "";
}

const kb = (n) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

/** Read-only, in-app letter display (inline viewer + expand). Used when reviewing a trainer. */
export function LetterView({ user, height = 420 }) {
  const [open, setOpen] = useState(false);
  if (!user?.partnershipLetter) return <p className="form-hint">No partnership letter uploaded.</p>;
  if (user.partnershipLetterAvailable === false) {
    return <p className="form-hint letter-warn"><AlertTriangle size={14} /> The uploaded letter file is missing on the server. The trainer or an admin should upload it again.</p>;
  }
  if (user.partnershipLetterKind === "other") {
    return <p className="form-hint letter-warn"><AlertTriangle size={14} /> This letter is in an old format that cannot be shown in the app. Upload it again as a PDF or image.</p>;
  }
  return (
    <div className="letter-box">
      <div style={{ height }}><DocumentViewer src={user.partnershipLetter} title={user.partnershipLetterName || "Partnership letter"} /></div>
      <button type="button" className="ghost-button" onClick={() => setOpen(true)}><Maximize2 size={14} /> Expand</button>
      <DocumentModal open={open} title={user.partnershipLetterName || "Partnership letter"} src={user.partnershipLetter} onClose={() => setOpen(false)} />
    </div>
  );
}

/**
 * Upload / replace / preview a partnership letter, entirely in-app.
 * `user` supplies the current letter (if any); `file`/`onFile` hold a newly selected file.
 */
export default function LetterField({ user, file, onFile, label = "Partnership / approval letter", required = false, error = "", id = "letter" }) {
  const [viewing, setViewing] = useState(null);   // "current" | "new" | null
  const [localError, setLocalError] = useState("");
  const blobUrl = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);
  useEffect(() => () => { if (blobUrl) URL.revokeObjectURL(blobUrl); }, [blobUrl]);

  const hasCurrent = Boolean(user?.partnershipLetter);
  const missing = hasCurrent && user.partnershipLetterAvailable === false;
  const legacy = hasCurrent && user.partnershipLetterKind === "other";

  function pick(e) {
    const f = e.target.files?.[0] || null;
    const msg = validateLetter(f);
    setLocalError(msg);
    onFile(msg ? null : f);
    if (msg) e.target.value = "";
  }

  return (
    <div className="letter-field">
      <label htmlFor={id} className="field-label">{label}{required && <span aria-hidden="true"> *</span>}</label>

      {hasCurrent && !file && (
        <div className={`letter-current ${missing || legacy ? "letter-current--warn" : ""}`}>
          <FileText size={18} />
          <div className="letter-meta">
            <strong>{user.partnershipLetterName || "Partnership letter"}</strong>
            <small>{missing ? "File missing on the server — upload it again." : legacy ? "Old format — upload a PDF or image." : "Uploaded"}</small>
          </div>
          {!missing && !legacy && <button type="button" className="ghost-button" onClick={() => setViewing("current")}><Eye size={14} /> View</button>}
        </div>
      )}

      {file && (
        <div className="letter-current letter-current--new">
          <FileText size={18} />
          <div className="letter-meta"><strong>{file.name}</strong><small>{kb(file.size)} · will replace the current letter when you save</small></div>
          <button type="button" className="ghost-button" onClick={() => setViewing("new")}><Eye size={14} /> Preview</button>
          <button type="button" className="ghost-button" onClick={() => { onFile(null); setLocalError(""); }} aria-label="Remove selected file"><Trash2 size={14} /></button>
        </div>
      )}

      <input id={id} className="file-input-hidden" type="file" accept={LETTER_ACCEPT} onChange={pick} key={file ? "has" : "none"} />
      <label className="file-drop" htmlFor={id}>
        <Upload size={16} /> <span>{hasCurrent || file ? "Choose a replacement file" : "Choose a file"} <small>(PDF, JPG, PNG or WebP · max 10 MB)</small></span>
      </label>

      {(localError || error) && <span className="field-error" role="alert">{localError || error}</span>}

      <DocumentModal open={viewing === "current"} title={user?.partnershipLetterName || "Partnership letter"} src={user?.partnershipLetter} onClose={() => setViewing(null)} />
      <DocumentModal open={viewing === "new"} title={file?.name || "Selected file"} src={blobUrl} onClose={() => setViewing(null)} />
    </div>
  );
}
