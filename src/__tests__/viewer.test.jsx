import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("pdfjs-dist", () => ({ GlobalWorkerOptions: {}, getDocument: vi.fn() }));
vi.mock("pdfjs-dist/build/pdf.worker.min.mjs?url", () => ({ default: "/worker.js" }));

import DocumentViewer from "components/ui/DocumentViewer.jsx";
import LetterField, { LetterView, validateLetter } from "components/forms/LetterField.jsx";

const resp = (body, type, status = 200) => ({
  ok: status < 400, status,
  headers: { get: () => type },
  json: async () => body, text: async () => String(body), blob: async () => new Blob(["x"], { type }), arrayBuffer: async () => new ArrayBuffer(8),
});

beforeEach(() => {
  global.URL.createObjectURL = vi.fn(() => "blob:mock");
  global.URL.revokeObjectURL = vi.fn();
});
afterEach(() => vi.restoreAllMocks());

test("viewer fetches with the session, renders an image inline and offers no download/open actions", async () => {
  const f = vi.spyOn(global, "fetch").mockResolvedValue(resp("", "image/png"));
  const { container } = render(<DocumentViewer src="http://127.0.0.1:8002/api/users/1/partnership-letter/" title="Letter" />);
  await waitFor(() => expect(container.querySelector("img")).toBeTruthy());
  expect(f.mock.calls[0][0]).toBe("/api/users/1/partnership-letter/");     // same-origin, via proxy
  expect(f.mock.calls[0][1]).toMatchObject({ credentials: "include" });
  expect(container.querySelector("a[href]")).toBeNull();
  expect(container.querySelector("[download]")).toBeNull();
  expect(container.querySelector('[target="_blank"]')).toBeNull();
});

test("viewer shows the server's message when the file is missing", async () => {
  vi.spyOn(global, "fetch").mockResolvedValue(resp({ error: "The letter file is missing on the server." }, "application/json", 404));
  render(<DocumentViewer src="/api/users/1/partnership-letter/" />);
  expect(await screen.findByRole("alert")).toHaveTextContent("missing on the server");
});

test("viewer refuses unsupported formats instead of handing out a download", async () => {
  vi.spyOn(global, "fetch").mockResolvedValue(resp("", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"));
  render(<DocumentViewer src="/api/x" />);
  expect(await screen.findByRole("alert")).toHaveTextContent(/cannot be viewed in the app/i);
});

test("letter validation allows PDF/images only and caps size", () => {
  expect(validateLetter(new File(["a"], "a.pdf"))).toBe("");
  expect(validateLetter(new File(["a"], "a.png"))).toBe("");
  expect(validateLetter(new File(["a"], "a.docx"))).toMatch(/PDF or an image/);
  expect(validateLetter(new File(["a"], "a.exe"))).toMatch(/PDF or an image/);
  const big = new File(["a"], "big.pdf"); Object.defineProperty(big, "size", { value: 11 * 1024 * 1024 });
  expect(validateLetter(big)).toMatch(/10 MB/);
});

test("LetterField: shows the current letter, warns when missing, previews a new selection in-app", () => {
  const onFile = vi.fn();
  const user = { partnershipLetter: "/api/users/1/partnership-letter/", partnershipLetterName: "slip.pdf", partnershipLetterAvailable: false, partnershipLetterKind: "pdf" };
  const { container, rerender } = render(<LetterField user={user} file={null} onFile={onFile} />);
  expect(screen.getByText("slip.pdf")).toBeInTheDocument();
  expect(screen.getByText(/missing on the server/i)).toBeInTheDocument();
  expect(screen.queryByText("View")).toBeNull();

  const input = container.querySelector('input[type="file"]');
  fireEvent.change(input, { target: { files: [new File(["x"], "bad.docx")] } });
  expect(onFile).toHaveBeenLastCalledWith(null);
  expect(screen.getByRole("alert")).toHaveTextContent(/PDF or an image/);

  rerender(<LetterField user={user} file={new File(["x"], "new.pdf")} onFile={onFile} />);
  expect(screen.getByText("new.pdf")).toBeInTheDocument();
  expect(screen.getByText(/Preview/)).toBeInTheDocument();
  expect(container.querySelector("a[href]")).toBeNull();
});

test("LetterView explains absent / missing letters without links", () => {
  const { rerender, container } = render(<LetterView user={{ partnershipLetter: null }} />);
  expect(screen.getByText(/No partnership letter/i)).toBeInTheDocument();
  rerender(<LetterView user={{ partnershipLetter: "/api/users/1/partnership-letter/", partnershipLetterAvailable: false }} />);
  expect(screen.getByText(/missing on the server/i)).toBeInTheDocument();
  expect(container.querySelector("a[href]")).toBeNull();
});

test("LetterView: expanding enlarges the SAME viewer - the letter is downloaded once, not twice", async () => {
  const f = vi.spyOn(global, "fetch").mockResolvedValue(resp("", "image/png"));
  const user = { partnershipLetter: "/api/users/1/partnership-letter/", partnershipLetterName: "slip.png", partnershipLetterAvailable: true, partnershipLetterKind: "image" };
  const { container } = render(<LetterView user={user} />);
  await waitFor(() => expect(container.querySelector("img")).toBeTruthy());
  fireEvent.click(screen.getByRole("button", { name: /expand/i }));
  expect(screen.getByRole("dialog")).toBeTruthy();
  expect(document.querySelectorAll(".docv").length).toBe(1);        // one viewer, not inline + modal
  expect(f).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: /close/i }));
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(f).toHaveBeenCalledTimes(1);
});

test("a web page returned instead of the file is explained, never dumped as text", async () => {
  vi.spyOn(global, "fetch").mockResolvedValue(resp("<!doctype html><html><head></head><body>app</body></html>", "text/html; charset=utf-8"));
  const { container } = render(<LetterView user={{ partnershipLetter: "/api/users/1/partnership-letter/", partnershipLetterAvailable: true, partnershipLetterKind: "pdf" }} />);
  await waitFor(() => expect(screen.getByText(/returned a web page instead of the file/i)).toBeTruthy());
  expect(container.querySelector("pre")).toBeNull();
});
