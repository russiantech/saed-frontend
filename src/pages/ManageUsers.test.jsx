import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";

import ManageUsers from "./ManageUsers.jsx";
import { api } from "../lib/api.js";

jest.mock("../lib/api.js", () => ({ api: jest.fn() }));

test("shows validation errors before creating a user", async () => {
  api.mockResolvedValue({ users: [] });
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(<MemoryRouter><ManageUsers /></MemoryRouter>);
  });

  const addButton = [...container.querySelectorAll("button")].find((button) => button.textContent.match(/add trainer/i));
  await act(async () => {
    addButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });

  expect(container.textContent).toContain("Enter first and last name.");
  expect(container.textContent).toContain("Enter a valid email address.");
});
