import fs from "node:fs";
import path from "node:path";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import SafeImage from "components/ui/SafeImage.jsx";

const PUB = path.resolve(__dirname, "../../public");
const read = (f) => fs.readFileSync(path.join(PUB, f), "utf8");

function loadSw(fetchImpl) {
  const listeners = {}; const store = new Map();
  const cache = { match: async (r) => store.get(r.url), put: (r, res) => store.set(r.url, res) };
  const self = { location: { origin: "https://app.example.com" }, addEventListener: (t, fn) => { listeners[t] = fn; }, skipWaiting() {}, clients: { claim() {} } };
  new Function("self", "caches", "fetch", "Response", "URL", read("sw.js"))(self, { open: async () => cache, match: async () => undefined, keys: async () => [] }, fetchImpl, { error: () => "ERR" }, URL);
  return { listeners, store };
}
const res = (type, ok = true) => ({ ok, type: "basic", headers: { get: () => type }, clone() { return this; } });

describe("service worker never caches a web page as a file", () => {
  it("does not store index.html returned (HTTP 200) for a missing image", async () => {
    const { listeners, store } = loadSw(() => Promise.resolve(res("text/html; charset=utf-8")));
    const e = { request: { url: "https://app.example.com/activities/registration.jpg", method: "GET", mode: "no-cors" }, respondWith: (p) => { e.p = p; } };
    listeners.fetch(e); await e.p; await new Promise((r) => setTimeout(r, 0));
    expect(store.size).toBe(0);
  });
  it("does not store an HTML fallback for a missing hashed asset either", async () => {
    const { listeners, store } = loadSw(() => Promise.resolve(res("text/html")));
    const e = { request: { url: "https://app.example.com/assets/chunk-abc.js", method: "GET", mode: "cors" }, respondWith: (p) => { e.p = p; } };
    listeners.fetch(e); await e.p;
    expect(store.size).toBe(0);
  });
  it("still stores a real image", async () => {
    const { listeners, store } = loadSw(() => Promise.resolve(res("image/jpeg")));
    const e = { request: { url: "https://app.example.com/activities/sports.jpg", method: "GET", mode: "no-cors" }, respondWith: (p) => { e.p = p; } };
    listeners.fetch(e); await e.p; await new Promise((r) => setTimeout(r, 0));
    expect(store.size).toBe(1);
  });
  it("uses a new cache version so any earlier (possibly polluted) cache is purged", () => {
    expect(read("sw.js")).toMatch(/saed-pwa-v2\.5\.2/);
  });
});

describe("hosting rules do not answer file/API requests with the web page", () => {
  it(".htaccess returns 404 for /api and missing files, and only extension-less paths fall back to index.html", () => {
    const h = read(".htaccess");
    expect(h).toMatch(/RewriteRule \^\(api\|media\|admin\|docs\|redoc\|static\)\/ - \[R=404,L\]/);
    expect(h).toMatch(/RewriteCond %\{REQUEST_URI\} !\\\.\[A-Za-z0-9\]\{1,6\}\$/);
  });
});

describe("SafeImage", () => {
  it("shows a placeholder instead of a broken image when the file fails to load", () => {
    const { container } = render(<SafeImage src="/activities/missing.jpg" alt="Registration" />);
    fireEvent.error(container.querySelector("img"));
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByRole("img", { name: "Registration" })).toBeTruthy();
  });
  it("renders the image normally otherwise", () => {
    const { container } = render(<SafeImage src="/activities/ok.jpg" alt="Sports" />);
    expect(container.querySelector("img").getAttribute("src")).toBe("/activities/ok.jpg");
  });
});
