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

// Chrome/Edge/Android fire this when the app is installable; we keep it for our own button.
export function listenForInstall(onChange) {
  const before = (e) => { e.preventDefault(); deferredPrompt = e; onChange(true); };
  const done = () => { deferredPrompt = null; onChange(false); };
  window.addEventListener("beforeinstallprompt", before);
  window.addEventListener("appinstalled", done);
  return () => { window.removeEventListener("beforeinstallprompt", before); window.removeEventListener("appinstalled", done); };
}

export async function promptInstall() {
  if (!deferredPrompt) return "unavailable";
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  return outcome;                                                             // "accepted" | "dismissed"
}
