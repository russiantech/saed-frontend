import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ pagination, onPage }) {
  if (!pagination || pagination.totalPages <= 1) return null;
  const { page, totalPages, total } = pagination;
  return (
    <nav className="pagination" aria-label="Pagination" style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "center", margin: "20px 0" }}>
      <button type="button" className="ghost-button" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        <ChevronLeft size={16} /> Previous
      </button>
      <span style={{ fontSize: 13, color: "var(--muted)" }}>Page {page} of {totalPages}{total != null ? ` · ${total} total` : ""}</span>
      <button type="button" className="ghost-button" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
        Next <ChevronRight size={16} />
      </button>
    </nav>
  );
}
