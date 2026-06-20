import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";

import ProgramEditor from "./ProgramEditor.jsx";
import { api } from "../lib/api.js";

jest.mock("../lib/api.js", () => ({ api: jest.fn() }));

test("validates required program fields", async () => {
  api.mockResolvedValue({
    programs: [],
    categories: [{ value: "ict", label: "ICT" }],
    trainers: [{ id: 1, fullName: "Lead Trainer", email: "trainer@example.com" }],
  });
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(<MemoryRouter><ProgramEditor /></MemoryRouter>);
  });

  const newButton = [...container.querySelectorAll("button")].find((button) => button.textContent.match(/new program/i));
  await act(async () => {
    newButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });

  const saveButton = [...container.querySelectorAll("button")].find((button) => button.textContent.match(/save program/i));
  await act(async () => {
    saveButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });

  expect(container.textContent.match(/This field is required\./g).length).toBeGreaterThan(0);
});
