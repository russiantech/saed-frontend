import { expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import LessonMedia from "components/ui/LessonMedia.jsx";
import Pagination from "components/ui/Pagination.jsx";

test("LessonMedia plays an uploaded video in-app and shows text", () => {
  const { container } = render(<LessonMedia lesson={{ title: "L", video: { mode: "file", url: "/api/lessons/1/media/video/?t=x" }, textContent: "Notes here" }} />);
  expect(container.querySelector("video")).toHaveAttribute("src", "/api/lessons/1/media/video/?t=x");
  expect(screen.getByText("Notes here")).toBeInTheDocument();
});

test("LessonMedia embeds YouTube links instead of linking out", () => {
  const { container } = render(<LessonMedia lesson={{ title: "L", video: { mode: "external", url: "https://youtu.be/dQw4w9WgXcQ" } }} />);
  expect(container.querySelector("iframe").src).toContain("youtube.com/embed/dQw4w9WgXcQ");
});

test("LessonMedia never offers a link/new tab for documents", async () => {
  const { container } = render(<LessonMedia lesson={{ title: "L", document: { mode: "file", url: "/api/x", name: "a.pdf" } }} />);
  expect(container.querySelector("a[href]")).toBeNull();
  expect(container.querySelector('[target="_blank"]')).toBeNull();
  expect(container.querySelector("iframe")).toBeNull();
});

test("LessonMedia explains legacy external documents instead of linking out", () => {
  const { container } = render(<LessonMedia lesson={{ title: "L", document: { mode: "external", url: "https://evil.example/a.pdf" } }} />);
  expect(screen.getByText(/unavailable in the app/i)).toBeInTheDocument();
  expect(container.querySelector("a[href]")).toBeNull();
});

test("Pagination navigates and hides for a single page", () => {
  const onPage = vi.fn();
  const { rerender, container } = render(<Pagination pagination={{ page: 2, totalPages: 3, total: 30 }} onPage={onPage} />);
  fireEvent.click(screen.getByText(/Next/));
  expect(onPage).toHaveBeenCalledWith(3);
  fireEvent.click(screen.getByText(/Previous/));
  expect(onPage).toHaveBeenCalledWith(1);
  rerender(<Pagination pagination={{ page: 1, totalPages: 1 }} onPage={onPage} />);
  expect(container).toBeEmptyDOMElement();
});
