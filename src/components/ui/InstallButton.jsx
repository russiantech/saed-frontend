import { useState } from "react";
import { Download, X } from "lucide-react";

import useInstall from "hooks/useInstall.js";
import { installHelp, promptInstall } from "lib/pwa.js";

/**
 * Permanent "Install app" button. One tap installs where the browser allows it; otherwise it explains how for the
 * visitor's browser. Hidden only once the app is installed / running as an installed app.
 */
export default function InstallButton({ className = "", label = "Install app", compact = false }) {
  const { canPrompt, installed } = useInstall();
  const [help, setHelp] = useState(null);
  if (installed) return null;

  async function click() {
    if (canPrompt) {
      const outcome = await promptInstall();
      if (outcome !== "unavailable") return;       // accepted or dismissed: the browser handled it
    }
    setHelp(installHelp());
  }

  return (
    <>
      <button type="button" className={`install-button ${className}`} onClick={click} aria-label={label}>
        <Download size={compact ? 16 : 18} aria-hidden="true" />{!compact && <span>{label}</span>}
      </button>
      {help && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={help.title} onClick={() => setHelp(null)}>
          <div className="modal-content install-help" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setHelp(null)} aria-label="Close"><X size={20} /></button>
            <h3>{help.title}</h3>
            <ol>{help.steps.map((t) => <li key={t}>{t}</li>)}</ol>
          </div>
        </div>
      )}
    </>
  );
}
