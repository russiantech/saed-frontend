import { lazy, Suspense } from "react";

const Viewer = lazy(() => import("components/ui/DocumentViewer.jsx"));
const Modal = lazy(() => import("components/ui/DocumentViewer.jsx").then((m) => ({ default: m.DocumentModal })));

const fallback = <p style={{ padding: 24, textAlign: "center", color: "var(--muted)" }}>Opening document…</p>;

/** The PDF engine (~1 MB) is only downloaded when a document is actually opened. */
export default function LazyDocumentViewer(props) {
  return <Suspense fallback={fallback}><Viewer {...props} /></Suspense>;
}

export function LazyDocumentModal(props) {
  if (!props.open) return null;
  return <Suspense fallback={null}><Modal {...props} /></Suspense>;
}
