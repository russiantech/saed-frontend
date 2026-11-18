import { beforeEach, expect, test, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("lib/api.js", () => ({ api: vi.fn() }));
import { api } from "lib/api.js";
import OrientationCamps from "pages/admin/OrientationCamps.jsx";
import AuthLayout from "components/auth/AuthLayout.jsx";

const camp = { id: 1, name: "Lagos Camp", state: "Lagos", location: "Iyana-Ipaja", startDate: "2026-11-01", endDate: "2026-11-21",
  deactivationGraceDays: 7, isActive: true, courseCount: 2, corperCount: 5 };

beforeEach(() => api.mockReset());

test("admin sees camps with usage counts and can add one", async () => {
  api.mockImplementation(async (path, opts) => {
    if (opts?.method === "POST") return { camp: { ...camp, id: 2, name: "Ogun Camp" } };
    return { camps: [camp] };
  });
  render(<MemoryRouter><OrientationCamps /></MemoryRouter>);
  expect(await screen.findByText("Lagos Camp")).toBeInTheDocument();
  expect(screen.getByText("Active")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /add camp/i }));
  const dialog = screen.getByRole("dialog");
  fireEvent.change(dialog.querySelector("input[placeholder^='e.g. Lagos']"), { target: { value: "Ogun Camp" } });
  fireEvent.change(dialog.querySelectorAll("select")[1], { target: { value: "Ogun" } }); // [0] is the stream
  const dates = dialog.querySelectorAll("input[type=date]");
  fireEvent.change(dates[0], { target: { value: "2026-12-01" } });
  fireEvent.change(dates[1], { target: { value: "2026-12-21" } });
  fireEvent.submit(dialog.querySelector("form"));
  await waitFor(() => expect(api.mock.calls.some(([p, o]) => p === "/manage/orientation-camps/" && o?.method === "POST")).toBe(true));
  const post = api.mock.calls.find(([, o]) => o?.method === "POST")[1];
  expect(post.body).toMatchObject({ name: "Ogun Camp", state: "Ogun", startDate: "2026-12-01", endDate: "2026-12-21" });
});

test("end date before start date is rejected client-side", async () => {
  api.mockResolvedValue({ camps: [] });
  render(<MemoryRouter><OrientationCamps /></MemoryRouter>);
  fireEvent.click(await screen.findByRole("button", { name: /add camp/i }));
  const dialog = screen.getByRole("dialog");
  fireEvent.change(dialog.querySelector("input[placeholder^='e.g. Lagos']"), { target: { value: "X" } });
  fireEvent.change(dialog.querySelectorAll("select")[1], { target: { value: "Ogun" } }); // [0] is the stream
  const dates = dialog.querySelectorAll("input[type=date]");
  fireEvent.change(dates[0], { target: { value: "2026-12-21" } });
  fireEvent.change(dates[1], { target: { value: "2026-12-01" } });
  fireEvent.submit(dialog.querySelector("form"));
  expect(await screen.findByRole("alert")).toHaveTextContent(/end date/i);
});

test("auth pages show the logo and it links to the home page", () => {
  render(<MemoryRouter><AuthLayout title="Sign in"><p>x</p></AuthLayout></MemoryRouter>);
  const link = screen.getByRole("link", { name: /go to home page/i });
  expect(link).toHaveAttribute("href", "/");
  expect(link.querySelector("img")).toHaveAttribute("src", "/logo.png");
});
