import { useEffect, useState } from "react";
import { Download, RefreshCw, Share, X } from "lucide-react";

import useInstall from "hooks/useInstall.js";
import { applyUpdate, isIos, onUpdateAvailable, promptInstall } from "lib/pwa.js";

const KEY = "saed:install-dismissed";
const DAYS = 14;
const dismissedRecently = () => {
  try { return Date.now() - Number(localStorage.getItem(KEY) || 0) < DAYS * 864e5; } catch { return false; }
};
const remember = () => { try { localStorage.setItem(KEY, String(Date.now())); } catch { /* private mode */ } };

/** One-off install banner (dismissable; the permanent <InstallButton/> stays available) + "new version" notice. */
export default function InstallPrompt() {
  const { canPrompt: canInstall, installed } = useInstall();
  const [hidden, setHidden] = useState(dismissedRecently);
  const [update, setUpdate] = useState(null);
  const ios = isIos();

  useEffect(() => onUpdateAvailable(setUpdate), []);

  if (update) {
    return (
      <div className="pwa-bar pwa-bar--update" role="status">
        <RefreshCw size={16} aria-hidden="true" />
        <span>A new version of SAED is available.</span>
        <button type="button" className="primary-button" onClick={() => applyUpdate(update)}>Refresh</button>
      </div>
    );
  }
  if (installed || hidden || (!canInstall && !ios)) return null;
  const close = () => { remember(); setHidden(true); };
  return (
    <div className="pwa-bar" role="region" aria-label="Install the app">
      {canInstall ? <Download size={16} aria-hidden="true" /> : <Share size={16} aria-hidden="true" />}
      <span>{canInstall ? "Install SAED on your device for quicker access." : "Install SAED: tap Share, then “Add to Home Screen”."}</span>
      {canInstall && (
        <button type="button" className="primary-button"
          onClick={async () => { const r = await promptInstall(); if (r === "accepted") setHidden(true); else close(); }}>Install</button>
      )}
      <button type="button" className="ghost-button" onClick={close} aria-label="Not now"><X size={16} /></button>
    </div>
  );
}
