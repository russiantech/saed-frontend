import { beforeEach, expect, test, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("lib/api.js", async (orig) => ({ ...(await orig()), api: vi.fn() }));
vi.mock("lib/auth.jsx", () => ({ useAuth: () => ({ user: { role: "corps_member" } }) }));
import { api } from "lib/api.js";
import InCampSaed from "pages/corper/InCampSaed.jsx";

const skills = [{ value: "ict", label: "ICT" }, { value: "cosmetology", label: "Cosmetology" }, { value: "agro_allied", label: "Agro-Allied" }];
const course = (o) => ({ id: "c1", title: "Web Basics", courseType: "in_camp", category: "ict", categoryLabel: "ICT", lessonCount: 1,
  freeLessonCount: 1, paidLessonCount: 0, scheduledLessons: [], ...o });
const base = { role: "corps_member", accessActive: true, camps: [], skills, pagination: { page: 1, pageSize: 12, total: 0, totalPages: 1 } };

beforeEach(() => api.mockReset());
const show = () => render(<MemoryRouter><InCampSaed /></MemoryRouter>);

test("shows own skill set first, with a matching badge and the skill filter", async () => {
  api.mockResolvedValue({ ...base, skillMode: "mine", mySkills: [skills[0]], courses: [course({ matchesMySkills: true })] });
  show();
  expect(await screen.findByText("Web Basics")).toBeInTheDocument();
  expect(screen.getByText("Your skill set")).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent(/under your skill set \(ICT\) first/i);
  expect(screen.getByLabelText("Skill set")).toHaveValue("");
});

test("nothing under my skill set: says so and lets the user explore others optionally", async () => {
  api.mockImplementation(async (path) => String(path).includes("skill=all")
    ? { ...base, skillMode: "all", mySkills: [skills[1]], courses: [course({ matchesMySkills: false })] }
    : { ...base, skillMode: "mine", mySkills: [skills[1]], noSkillMatch: true, courses: [] });
  show();
  expect(await screen.findByText(/nothing listed under your skill set/i)).toBeInTheDocument();
  expect(screen.queryByText("Web Basics")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /explore other available courses/i }));
  expect(await screen.findByText("Web Basics")).toBeInTheDocument();
  await waitFor(() => expect(api.mock.calls.some(([p]) => String(p).includes("skill=all"))).toBe(true));
});

test("filtering by a skill with no courses says nothing is listed under it", async () => {
  api.mockResolvedValue({ ...base, skillMode: "specific", mySkills: [], selectedSkill: skills[1], courses: [] });
  show();
  expect(await screen.findByText(/nothing listed under cosmetology/i)).toBeInTheDocument();
});
