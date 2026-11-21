import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

import { isIos } from "lib/pwa.js";

const PUB = path.resolve(__dirname, "../../public");
const read = (f) => fs.readFileSync(path.join(PUB, f), "utf8");

/** Load public/sw.js into a fake service-worker scope and expose its listeners. */
function loadSw({ cached = {}, fetchImpl = () => Promise.reject(new Error("offline")) } = {}) {
  const listeners = {};
  const store = new Map(Object.entries(cached));
  const cache = { match: async (r) => store.get(typeof r === "string" ? r : r.url), put: vi.fn(async (r, res) => store.set(r.url, res)), addAll: vi.fn() };
  const self = {
    location: { origin: "https://app.example.com" },
    addEventListener: (t, fn) => { listeners[t] = fn; },
    skipWaiting: vi.fn(), clients: { claim: vi.fn() },
  };
  const caches = { open: async () => cache, match: async (u) => store.get(u), keys: async () => [], delete: vi.fn() };
  new Function("self", "caches", "fetch", "Response", "URL", read("sw.js"))(self, caches, fetchImpl, { error: () => "ERR" }, URL);
  return { listeners, self, store };
}
const fetchEvent = (url, { method = "GET", mode = "cors" } = {}) => {
  const e = { request: { url, method, mode }, respondWith: vi.fn() };
  return e;
};

describe("service worker rules", () => {
  it("never handles the API, media, admin, docs, config.js or non-GET requests (no private data is cached)", () => {
    const { listeners } = loadSw();
    for (const u of ["/api/auth/me/", "/api/lessons/1/media/video/?t=x", "/media/p.png", "/admin/", "/docs/", "/config.js", "/sw.js"]) {
      const e = fetchEvent(`https://app.example.com${u}`);
      listeners.fetch(e);
      expect(e.respondWith, u).not.toHaveBeenCalled();
    }
    const post = fetchEvent("https://app.example.com/assets/a.js", { method: "POST" });
    listeners.fetch(post);
    expect(post.respondWith).not.toHaveBeenCalled();
  });

  it("never handles cross-origin requests (e.g. the API on another host, YouTube)", () => {
    const { listeners } = loadSw();
    for (const u of ["https://saed-api.simplylovely.ng/api/auth/me/", "https://www.youtube.com/embed/abc"]) {
      const e = fetchEvent(u);
      listeners.fetch(e);
      expect(e.respondWith, u).not.toHaveBeenCalled();
    }
  });

  it("handles navigations (offline page fallback) and hashed assets", () => {
    const { listeners } = loadSw({ fetchImpl: () => Promise.resolve({ ok: true, type: "basic", headers: { get: () => "application/javascript" }, clone: () => ({}) }) });
    const nav = fetchEvent("https://app.example.com/app/dashboard", { mode: "navigate" });
    listeners.fetch(nav);
    expect(nav.respondWith).toHaveBeenCalledTimes(1);
    const asset = fetchEvent("https://app.example.com/assets/index-abc.js");
    listeners.fetch(asset);
    expect(asset.respondWith).toHaveBeenCalledTimes(1);
  });

  it("serves /offline.html when a navigation fails", async () => {
    const { listeners } = loadSw({ cached: { "/offline.html": "OFFLINE" } });
    const nav = fetchEvent("https://app.example.com/login", { mode: "navigate" });
    listeners.fetch(nav);
    expect(await nav.respondWith.mock.calls[0][0]).toBe("OFFLINE");
  });

  it("waits for the user before activating a new version", () => {
    const { listeners, self } = loadSw();
    listeners.install({ waitUntil: () => {} });
    expect(self.skipWaiting).not.toHaveBeenCalled();
    listeners.message({ data: { type: "SKIP_WAITING" } });
    expect(self.skipWaiting).toHaveBeenCalled();
  });
});

describe("installability files", () => {
  const manifest = JSON.parse(read("manifest.webmanifest"));
  it("manifest has what browsers require to offer installation", () => {
    expect(manifest.name && manifest.short_name).toBeTruthy();
    expect(manifest.start_url).toMatch(/^\//);
    expect(manifest.display).toBe("standalone");
    expect(manifest.scope).toBe("/");
    const sizes = manifest.icons.map((i) => `${i.sizes}:${i.purpose}`);
    expect(sizes).toEqual(expect.arrayContaining(["192x192:any", "512x512:any", "512x512:maskable"]));
  });
  it("every icon and shortcut icon in the manifest exists on disk", () => {
    const files = [...manifest.icons, ...manifest.shortcuts.flatMap((s) => s.icons || [])].map((i) => i.src);
    for (const f of files) expect(fs.existsSync(path.join(PUB, f)), f).toBe(true);
    expect(fs.existsSync(path.join(PUB, "offline.html"))).toBe(true);
  });
  it("index.html links the manifest", () => {
    expect(fs.readFileSync(path.resolve(PUB, "../index.html"), "utf8")).toContain('rel="manifest" href="/manifest.webmanifest"');
  });
});

describe("pwa helpers", () => {
  it("shows the iOS hint only in Safari (other iOS browsers cannot install)", () => {
    expect(isIos("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit Safari/604.1")).toBe(true);
    expect(isIos("Mozilla/5.0 (iPhone) CriOS/120 Safari/604.1")).toBe(false);
    expect(isIos("Mozilla/5.0 (Linux; Android 14) Chrome/120")).toBe(false);
  });
});
