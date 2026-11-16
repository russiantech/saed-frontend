import { beforeEach, expect, test, vi } from "vitest";
import { naira, verifyPayment, verifyWithRetry } from "lib/payments.js";

vi.mock("lib/api.js", () => ({ api: vi.fn() }));
import { api } from "lib/api.js";

beforeEach(() => api.mockReset());

test("naira formats whole and fractional amounts", () => {
  expect(naira(2000)).toBe("₦2,000");
  expect(naira("1500.5")).toBe("₦1,500.50");
  expect(naira(null)).toBe("₦0");
});

test("a 409 amount mismatch is returned as 'mismatch', never thrown as a failure", async () => {
  const err = Object.assign(new Error("under review"), { status: 409, data: { error: "under review", status: "mismatch" } });
  api.mockRejectedValueOnce(err);
  const r = await verifyPayment("ref1");
  expect(r.status).toBe("mismatch");
});

test("other errors propagate", async () => {
  api.mockRejectedValueOnce(Object.assign(new Error("boom"), { status: 500 }));
  await expect(verifyPayment("ref1")).rejects.toThrow("boom");
});

test("verifyWithRetry stops at the first final state", async () => {
  api.mockResolvedValueOnce({ status: "pending" }).mockResolvedValueOnce({ status: "success" });
  const r = await verifyWithRetry("ref", { tries: 5, delayMs: 1 });
  expect(r.status).toBe("success");
  expect(api).toHaveBeenCalledTimes(2);
});

test("verifyWithRetry returns pending (not failure) when the bank is slow", async () => {
  api.mockResolvedValue({ status: "pending" });
  const r = await verifyWithRetry("ref", { tries: 2, delayMs: 1 });
  expect(r.status).toBe("pending");
});
