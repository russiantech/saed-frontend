// Progressive-web-app plumbing: service-worker registration, "update available" and "install" events.
// Production only - in development a service worker would serve stale files, so any old one is removed.

const EVENT_UPDATE = "saed:sw-update";
let deferredPrompt = null;

export const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone === true);

export const isIos = (ua = typeof navigator !== "undefined" ? navigator.userAgent : "") =>
  /iphone|ipad|ipod/i.test(ua) && !/crios|fxios|edgios/i.test(ua);          // Safari only (other iOS browsers cannot install)

export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (!import.meta.env.PROD) {                                                // dev: make sure nothing stale is controlling the page
    navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister())).catch(() => {});
    return;
  }
  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      const announce = (worker) => window.dispatchEvent(new CustomEvent(EVENT_UPDATE, { detail: { worker } }));
      if (reg.waiting && navigator.serviceWorker.controller) announce(reg.waiting);
      reg.addEventListener("updatefound", () => {
        const worker = reg.installing;
        worker?.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) announce(worker);
        });
      });
      setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);       // look for a new release hourly
      let reloading = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (reloading) return;
        reloading = true;
        window.location.reload();
      });
    } catch {
      /* not fatal: the site simply works without being installable */
    }
  });
}

export const onUpdateAvailable = (cb) => {
  const h = (e) => cb(e.detail.worker);
  window.addEventListener(EVENT_UPDATE, h);
  return () => window.removeEventListener(EVENT_UPDATE, h);
};
export const applyUpdate = (worker) => worker?.postMessage({ type: "SKIP_WAITING" });

// ── Install state (shared by the banner and the permanent "Install app" buttons) ─────────────────────────────
// Chrome/Edge/Android fire `beforeinstallprompt` once, early, when the app is installable. We capture it at start-up
// (initInstall, called from main.jsx before React renders) so no component can miss it, and share it through a tiny store.
let installed = isStandalone();
const subscribers = new Set();
const emit = () => subscribers.forEach((fn) => fn());
let snapshot = { canPrompt: false, installed };
const refresh = () => { snapshot = { canPrompt: Boolean(deferredPrompt), installed }; emit(); };

export function initInstall() {
  if (typeof window === "undefined") return;
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferredPrompt = e; refresh(); });
  window.addEventListener("appinstalled", () => { deferredPrompt = null; installed = true; refresh(); });
  window.matchMedia?.("(display-mode: standalone)")?.addEventListener?.("change", (e) => { installed = e.matches; refresh(); });
}
export const subscribeInstall = (fn) => { subscribers.add(fn); return () => subscribers.delete(fn); };
export const getInstallSnapshot = () => snapshot;

/** What to tell the user when the browser has no one-tap prompt (or it was already used/dismissed). */
export function installHelp(ua = typeof navigator !== "undefined" ? navigator.userAgent : "") {
  if (isIos(ua)) return { title: "Install on iPhone / iPad", steps: ["Tap the Share button in Safari (square with an arrow).", "Scroll down and tap “Add to Home Screen”.", "Tap Add. SAED opens like an app from your home screen."] };
  if (/iphone|ipad|ipod/i.test(ua)) return { title: "Install on iPhone / iPad", steps: ["Open this page in Safari (other iOS browsers cannot install apps).", "Tap Share, then “Add to Home Screen”."] };
  if (/android/i.test(ua)) return { title: "Install on Android", steps: ["Open the browser menu (⋮).", "Tap “Install app” (or “Add to Home screen”).", "Confirm. SAED appears with your other apps."] };
  if (/firefox/i.test(ua)) return { title: "Install", steps: ["Desktop Firefox cannot install web apps. Open this site in Chrome or Edge to install it.", "On Android, Firefox: menu (⋮) → Install."] };
  return { title: "Install on your computer", steps: ["Look for the install icon (a screen with a down arrow) at the right end of the address bar, or open the browser menu.", "Choose “Install SAED” (Chrome/Edge: ⋮ → Cast, save and share → Install page as app).", "SAED opens in its own window."] };
}

export async function promptInstall() {
  if (!deferredPrompt) return "unavailable";
  const evt = deferredPrompt;
  deferredPrompt = null;                         // a prompt event can only be used once
  refresh();
  evt.prompt();
  const { outcome } = await evt.userChoice;
  return outcome;                                // "accepted" | "dismissed"
}
