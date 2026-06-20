import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";

import ManageApplications from "./ManageApplications.jsx";
import { api } from "../lib/api.js";

jest.mock("../lib/api.js", () => ({ api: jest.fn() }));

const authState = { user: null };

jest.mock("../lib/auth.jsx", () => ({
  useAuth: () => authState,
}));

async function renderPage(component) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(<MemoryRouter>{component}</MemoryRouter>);
  });
  return { container, root };
}

function rowFor(container, name) {
  return [...container.querySelectorAll(".management-row")].find((r) => r.textContent.includes(name));
}

function actionButton(row, label) {
  return [...row.querySelectorAll("button")].find((b) => new RegExp(label, "i").test(b.textContent));
}

test("trainer can approve an application", async () => {
  authState.user = { role: "trainer" };

  api.mockImplementation((path, options) => {
    if (path === "/manage/applications/" && !options) {
      return Promise.resolve({
        applications: [
          {
            id: 1,
            status: "pending",
            applicant: { fullName: "Jane Doe", email: "jane@example.com" },
            program: { title: "ICT Skills", location: "Lagos" },
          },
        ],
      });
    }
    if (path === "/manage/applications/1/" && options?.method === "PATCH") {
      return Promise.resolve({ application: { id: 1, status: "approved" } });
    }
    return Promise.resolve({ applications: [] });
  });

  const { container } = await renderPage(<ManageApplications />);

  expect(container.textContent).toContain("Jane Doe");
  await act(async () => {
    actionButton(rowFor(container, "Jane Doe"), "approve").dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });

  expect(api).toHaveBeenCalledWith("/manage/applications/1/", expect.objectContaining({ method: "PATCH" }));
});

test("trainer cannot change a completed application (action buttons disabled)", async () => {
  authState.user = { role: "trainer" };

  api.mockResolvedValue({
    applications: [
      {
        id: 2,
        status: "completed",
        applicant: { fullName: "John Roe", email: "john@example.com" },
        program: { title: "Food Skills", location: "Abuja" },
      },
    ],
  });

  const { container } = await renderPage(<ManageApplications />);

  const row = rowFor(container, "John Roe");
  expect(row).toBeTruthy();
  expect(actionButton(row, "approve").disabled).toBe(true);
  expect(actionButton(row, "decline").disabled).toBe(true);
  expect(actionButton(row, "complete").disabled).toBe(true);
});

test("admin can still change a completed application (action buttons enabled)", async () => {
  authState.user = { role: "saed_admin" };

  api.mockResolvedValue({
    applications: [
      {
        id: 3,
        status: "completed",
        applicant: { fullName: "Ada Admin", email: "ada@example.com" },
        program: { title: "ICT Skills", location: "Lagos" },
      },
    ],
  });

  const { container } = await renderPage(<ManageApplications />);

  const row = rowFor(container, "Ada Admin");
  expect(row).toBeTruthy();
  // Admin can still approve and decline a completed application.
  expect(actionButton(row, "approve").disabled).toBe(false);
  expect(actionButton(row, "decline").disabled).toBe(false);
  // The "Complete" action is still disabled because the row is already completed.
  expect(actionButton(row, "complete").disabled).toBe(true);
});
