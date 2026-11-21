import { describe, expect, it, vi } from "vitest";

import { isCrossOriginApi, lookupByHost, resolveApiBase, resolveMediaUrl } from "lib/config.js";
import { checkApi } from "lib/apiHealth.js";

describe("resolveApiBase", () => {
  it("defaults to same-origin /api", () => {
    expect(resolveApiBase({}, "")).toBe("/api");
    expect(resolveApiBase(undefined, undefined)).toBe("/api");
  });
  it("prefers the runtime config.js value over the build value", () => {
    expect(resolveApiBase({ API_URL: "https://api.example.com/api" }, "/api")).toBe("https://api.example.com/api");
  });
  it("falls back to the build-time value", () => {
    expect(resolveApiBase({}, "https://b.example.org/api")).toBe("https://b.example.org/api");
  });
  it("trims whitespace and trailing slashes", () => {
    expect(resolveApiBase({ API_URL: "  https://api.example.com/api/// " })).toBe("https://api.example.com/api");
  });
  it("adds /api when only a host is given", () => {
    expect(resolveApiBase({ API_URL: "https://api.example.com" })).toBe("https://api.example.com/api");
    expect(resolveApiBase({ API_URL: "https://api.example.com/" })).toBe("https://api.example.com/api");
  });
});

describe("per-environment API table", () => {
  const table = {
    "saed.dunistech.ng": "https://saed-api.simplylovely.ng/api",
    "localhost": "/api",
    "*.staging.example.com": "https://api.staging.example.com",
    "*.example.com": "https://api.example.com/api",
  };
  it("picks the API by the host the app is opened on", () => {
    expect(resolveApiBase({ API_URLS: table }, "", "saed.dunistech.ng")).toBe("https://saed-api.simplylovely.ng/api");
    expect(resolveApiBase({ API_URLS: table }, "", "localhost")).toBe("/api");
  });
  it("supports wildcards, most specific first, and normalises host-only values", () => {
    expect(resolveApiBase({ API_URLS: table }, "", "a.staging.example.com")).toBe("https://api.staging.example.com/api");
    expect(resolveApiBase({ API_URLS: table }, "", "app.example.com")).toBe("https://api.example.com/api");
  });
  it("is case-insensitive and falls back to the build value, then /api", () => {
    expect(lookupByHost(table, "SAED.DUNISTECH.NG")).toBe("https://saed-api.simplylovely.ng/api");
    expect(resolveApiBase({ API_URLS: table }, "https://b.example.org/api", "unknown.test")).toBe("https://b.example.org/api");
    expect(resolveApiBase({ API_URLS: table }, "", "unknown.test")).toBe("/api");
  });
  it("lets an explicit API_URL override the table", () => {
    expect(resolveApiBase({ API_URL: "https://x.example.com/api", API_URLS: table }, "", "localhost")).toBe("https://x.example.com/api");
  });
});

describe("resolveMediaUrl", () => {
  const ABS = "https://saed-api.simplylovely.ng/api";
  it("prefixes API-relative paths (partnership letters) with the API origin when the API is on another host", () => {
    expect(resolveMediaUrl("/api/users/5/partnership-letter/", ABS)).toBe("https://saed-api.simplylovely.ng/api/users/5/partnership-letter/");
    expect(resolveMediaUrl("/media/profiles/a.png", ABS)).toBe("https://saed-api.simplylovely.ng/media/profiles/a.png");
  });
  it("leaves the app's own static files, blobs, data URLs and external links alone", () => {
    expect(resolveMediaUrl("/images/hero.jpg", ABS)).toBe("/images/hero.jpg");
    expect(resolveMediaUrl("blob:https://app/xyz", ABS)).toBe("blob:https://app/xyz");
    expect(resolveMediaUrl("data:image/png;base64,AAAA", ABS)).toBe("data:image/png;base64,AAAA");
    expect(resolveMediaUrl("https://cdn.example.com/a.mp4", ABS)).toBe("https://cdn.example.com/a.mp4");
  });
  it("stays same-origin when /api is proxied", () => {
    expect(resolveMediaUrl("/api/users/5/partnership-letter/", "/api")).toBe("/api/users/5/partnership-letter/");
    expect(resolveMediaUrl("http://127.0.0.1:8002/api/lessons/1/media/video/?t=abc", "/api")).toBe("/api/lessons/1/media/video/?t=abc");
  });
  it("passes empty values through", () => {
    expect(resolveMediaUrl("", ABS)).toBe("");
    expect(resolveMediaUrl(null, ABS)).toBe(null);
  });
});

describe("isCrossOriginApi", () => {
  it("is false for relative bases and same origin", () => {
    expect(isCrossOriginApi("/api", "https://app.example.com")).toBe(false);
    expect(isCrossOriginApi("https://app.example.com/api", "https://app.example.com")).toBe(false);
  });
  it("is true for another host", () => {
    expect(isCrossOriginApi("https://api.example.org/api", "https://app.example.com")).toBe(true);
  });
});

const res = (body, type, status = 200) => ({
  ok: status < 400, status, headers: { get: () => type }, json: async () => body,
});

describe("checkApi", () => {
  it("accepts the API health response", async () => {
    expect(await checkApi("/api", vi.fn().mockResolvedValue(res({ status: "ok" }, "application/json")))).toEqual({ ok: true });
  });
  it("flags HTML (the app answering for itself)", async () => {
    const r = await checkApi("/api", vi.fn().mockResolvedValue(res(null, "text/html; charset=utf-8")));
    expect(r).toMatchObject({ ok: false, reason: "html" });
  });
  it("flags server errors and network failures", async () => {
    expect(await checkApi("/api", vi.fn().mockResolvedValue(res({}, "application/json", 500)))).toMatchObject({ reason: "status" });
    expect(await checkApi("/api", vi.fn().mockRejectedValue(new Error("x")))).toMatchObject({ reason: "network" });
  });
});
