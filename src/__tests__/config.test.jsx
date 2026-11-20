import { describe, expect, it, vi } from "vitest";

import { isCrossOriginApi, resolveApiBase } from "lib/config.js";
import { checkApi } from "lib/apiHealth.js";

describe("resolveApiBase", () => {
  it("defaults to same-origin /api", () => {
    expect(resolveApiBase("", "")).toBe("/api");
    expect(resolveApiBase(undefined, undefined)).toBe("/api");
  });
  it("prefers the runtime config.js value over the build value", () => {
    expect(resolveApiBase("https://api.example.com/api", "/api")).toBe("https://api.example.com/api");
  });
  it("falls back to the build-time value", () => {
    expect(resolveApiBase("", "https://b.example.org/api")).toBe("https://b.example.org/api");
  });
  it("trims whitespace and trailing slashes", () => {
    expect(resolveApiBase("  https://api.example.com/api/// ")).toBe("https://api.example.com/api");
  });
  it("adds /api when only a host is given", () => {
    expect(resolveApiBase("https://api.example.com")).toBe("https://api.example.com/api");
    expect(resolveApiBase("https://api.example.com/")).toBe("https://api.example.com/api");
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
