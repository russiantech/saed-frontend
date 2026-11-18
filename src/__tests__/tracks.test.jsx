import { beforeEach, expect, test, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("lib/api.js", async (orig) => ({ ...(await orig()), api: vi.fn() }));
import { api } from "lib/api.js";
import Signup from "pages/auth/Signup.jsx";
import SignupChooser from "pages/auth/SignupChooser.jsx";
import FloatingNav from "components/layout/FloatingNav.jsx";
import StreamBanner from "components/ui/StreamBanner.jsx";
import StreamExpired from "pages/dashboard/StreamExpired.jsx";
import Streams from "pages/admin/Streams.jsx";
import { trackOf, isInCamp } from "lib/track.js";

const wrap = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);
beforeEach(() => api.mockReset());

test("trackOf separates In-Camp and Post-Camp accounts; admins have none", () => {
  expect(trackOf({ role: "corps_member", track: "in_camp" })).toBe("in_camp");
  expect(trackOf({ role: "trainer", accountMode: "in_camp" })).toBe("in_camp");
  expect(trackOf({ role: "corps_member", track: "post_camp" })).toBe("post_camp");
  expect(trackOf({ role: "corps_member" })).toBe("post_camp");
  expect(trackOf({ role: "saed_admin" })).toBeNull();
  expect(isInCamp(null)).toBe(false);
});

test("front page nav says In-Camp and links to the In-Camp sign-up (no Explore)", () => {
  wrap(<FloatingNav />);
  const link = screen.getAllByRole("link", { name: "In-Camp" })[0];
  expect(link).toHaveAttribute("href", "/signup/in-camp");
  expect(screen.queryByText("Explore")).not.toBeInTheDocument();
});

test("sign-up chooser offers two separate programmes", () => {
  wrap(<SignupChooser />);
  expect(screen.getByRole("link", { name: /in-camp saed/i })).toHaveAttribute("href", "/signup/in-camp");
  expect(screen.getByRole("link", { name: /post-camp saed/i })).toHaveAttribute("href", "/signup/post-camp");
});

test("In-Camp sign-up has no trainer role and a Post-Camp sign-up has one", () => {
  const { unmount } = wrap(<Signup track="in_camp" />);
  expect(screen.getByText(/in-camp saed sign-up/i)).toBeInTheDocument();
  expect(screen.queryByText(/trainer/i)).not.toBeInTheDocument();
  unmount();
  wrap(<Signup track="post_camp" />);
  expect(screen.getByText(/post-camp saed sign-up/i)).toBeInTheDocument();
  expect(screen.getAllByText(/trainer/i).length).toBeGreaterThan(0);
});

test("In-Camp step 2 asks for a stream and has no LGA or PPA", async () => {
  api.mockResolvedValue({ streams: [{ id: 7, name: "2026 Stream 2", startDate: "2026-10-05", endDate: "2026-10-25", deactivationDate: "2026-10-25", camps: [{ id: 3, name: "Ogun Camp", state: "Ogun" }] }] });
  wrap(<Signup track="in_camp" />);
  const set = (placeholder, value) => fireEvent.change(screen.getByPlaceholderText(placeholder), { target: { value } });
  set("e.g. John Doe (first name first)", "Ada Obi");
  set("Choose a username", "adaobi");
  set("you@example.com", "ada@x.com");
  set("8012345678", "8012345678");
  set("Create a password", "Password123");
  set("Confirm password", "Password123");
  fireEvent.click(screen.getByRole("button", { name: /continue to next step/i }));
  expect(await screen.findByText("YOUR STREAM")).toBeInTheDocument();
  await waitFor(() => expect(screen.getByRole("option", { name: /2026 Stream 2/ })).toBeInTheDocument());
  expect(screen.queryByText(/LGA/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/Place of Primary Assignment/i)).not.toBeInTheDocument();
});

test("stream banner shows the duration and the days left; hidden for post-camp", () => {
  const lc = { track: "in_camp", isActive: true, state: "active", daysRemaining: 2,
    stream: { name: "2026 Stream 2", startDate: "2026-10-05", endDate: "2026-10-25", deactivationDate: "2026-10-25" } };
  const { container, rerender } = wrap(<StreamBanner lifecycle={lc} />);
  expect(screen.getByText("2026 Stream 2")).toBeInTheDocument();
  expect(screen.getByText("2 days left")).toBeInTheDocument();
  rerender(<MemoryRouter><StreamBanner lifecycle={{ track: "post_camp" }} /></MemoryRouter>);
  expect(container.querySelector(".stream-banner")).toBeNull();
});

test("expired In-Camp accounts see a clear deactivated message", () => {
  wrap(<StreamExpired role="trainer" lifecycle={{ state: "expired", reason: "stream_ended", stream: { name: "2026 Stream 1", endDate: "2026-02-01" } }} />);
  expect(screen.getByText(/your in-camp stream has ended/i)).toBeInTheDocument();
  expect(screen.getByText(/re-activate/i)).toBeInTheDocument();
});

test("admin creates a stream (1–6 per year) and sees server validation", async () => {
  const s = { id: 1, name: "2026 Stream 1", year: 2026, number: 1, startDate: "2026-10-05", endDate: "2026-10-25", deactivationDate: "2026-10-25",
    deactivationGraceDays: 0, isActive: true, status: "ended", counts: { camps: 0, courses: 0, corpers: 0, trainers: 0, pendingProposals: 0 } };
  api.mockImplementation(async (path, opts) => {
    if (opts?.method === "POST") throw Object.assign(new Error("Please correct the highlighted fields."), { data: { fields: { number: "Stream 1 of 2026 already exists." } } });
    return { streams: [s], years: [2026] };
  });
  wrap(<Streams />);
  expect(await screen.findByText("2026 Stream 1")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /new stream/i }));
  const dialog = screen.getByRole("dialog");
  const dates = dialog.querySelectorAll("input[type=date]");
  fireEvent.change(dates[0], { target: { value: "2026-11-02" } });
  fireEvent.change(dates[1], { target: { value: "2026-11-22" } });
  fireEvent.submit(dialog.querySelector("form"));
  expect(await screen.findByText("Stream 1 of 2026 already exists.")).toBeInTheDocument();
  const post = api.mock.calls.find(([, o]) => o?.method === "POST")[1];
  expect(post.body).toMatchObject({ number: 1, startDate: "2026-11-02", endDate: "2026-11-22" });
});
