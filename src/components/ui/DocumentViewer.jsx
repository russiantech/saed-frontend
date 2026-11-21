import { useCallback, useEffect, useRef, useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

import { resolveMediaUrl } from "lib/api.js";
import "styles/viewer.css";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

/**
 * In-app document viewer. The file is fetched with the user's session (never a public link),
 * rendered inside the page (PDF -> canvas, image -> <img>, text -> <pre>) and offers NO
 * download / open-in-new-tab / print action. Content-Disposition is "inline" server-side as well.
 */

async function readError(res) {
  try {
    const d = await res.json();
    return d.error || d.detail || "";
  } catch {
    return "";
  }
}

function PdfPage({ pdf, number, scale, root }) {
  const canvasRef = useRef(null);
  const holderRef = useRef(null);
  const [visible, setVisible] = useState(number <= 2);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    let alive = true;
    pdf.getPage(number).then((page) => {
      if (!alive) return;
      const vp = page.getViewport({ scale });
      setSize({ w: vp.width, h: vp.height });
    });
    return () => { alive = false; };
  }, [pdf, number, scale]);

  useEffect(() => {
    const el = holderRef.current;
    if (!el || typeof IntersectionObserver === "undefined") { setVisible(true); return undefined; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); },
      { root: root?.current || null, rootMargin: "600px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [root]);

  useEffect(() => {
    if (!visible || !size.w) return undefined;
    let task; let alive = true;
    pdf.getPage(number).then((page) => {
      if (!alive || !canvasRef.current) return;
      const ratio = window.devicePixelRatio || 1;
      const vp = page.getViewport({ scale: scale * ratio });
      const canvas = canvasRef.current;
      canvas.width = Math.floor(vp.width);
      canvas.height = Math.floor(vp.height);
      task = page.render({ canvasContext: canvas.getContext("2d"), viewport: vp });
      task.promise.catch(() => {});
    });
    return () => { alive = false; if (task) task.cancel(); };
  }, [pdf, number, scale, visible, size.w]);

  return (
    <div ref={holderRef} className="docv-page" style={{ width: size.w || undefined, height: size.h || 600 }} data-page={number}>
      <canvas ref={canvasRef} style={{ width: size.w, height: size.h }} aria-label={`Page ${number}`} />
    </div>
  );
}

function PdfView({ data }) {
  const scroller = useRef(null);
  const [pdf, setPdf] = useState(null);
  const [error, setError] = useState("");
  const [zoom, setZoom] = useState(1);
  const [fit, setFit] = useState(1);

  useEffect(() => {
    let task; let alive = true;
    task = pdfjs.getDocument({ data: data.slice(0), isEvalSupported: false, enableXfa: false });
    task.promise.then((d) => { if (alive) setPdf(d); }).catch(() => { if (alive) setError("This PDF could not be displayed."); });
    return () => { alive = false; task.destroy(); };
  }, [data]);

  useEffect(() => {
    if (!pdf) return;
    pdf.getPage(1).then((p) => {
      const w = (scroller.current?.clientWidth || 800) - 24;
      setFit(Math.max(0.4, Math.min(2, w / p.getViewport({ scale: 1 }).width)));
    });
  }, [pdf]);

  if (error) return <p className="docv-msg" role="alert">{error}</p>;
  if (!pdf) return <p className="docv-msg">Opening document…</p>;
  const scale = fit * zoom;
  return (
    <>
      <div className="docv-bar" role="toolbar" aria-label="Document controls">
        <button type="button" className="ghost-button" onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))} aria-label="Zoom out"><Minus size={16} /></button>
        <span aria-live="polite">{Math.round(zoom * 100)}%</span>
        <button type="button" className="ghost-button" onClick={() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))} aria-label="Zoom in"><Plus size={16} /></button>
        <span className="docv-count">{pdf.numPages} page{pdf.numPages === 1 ? "" : "s"}</span>
      </div>
      <div className="docv-scroll" ref={scroller}>
        {Array.from({ length: pdf.numPages }, (_, i) => (
          <PdfPage key={i + 1} pdf={pdf} number={i + 1} scale={scale} root={scroller} />
        ))}
      </div>
    </>
  );
}

export default function DocumentViewer({ src, title = "Document", onError }) {
  const [state, setState] = useState({ status: "loading" });
  const cleanup = useRef(null);

  const load = useCallback(async (signal) => {
    setState({ status: "loading" });
    try {
      const res = await fetch(resolveMediaUrl(src), { credentials: "include", signal });
      if (!res.ok) {
        const msg = await readError(res);
        throw new Error(msg || (res.status === 404 ? "This file is not available." : "This file could not be opened."));
      }
      const type = (res.headers.get("Content-Type") || "").split(";")[0].trim().toLowerCase();
      if (type === "application/pdf") {
        setState({ status: "pdf", data: await res.arrayBuffer() });
      } else if (type.startsWith("image/")) {
        const url = URL.createObjectURL(await res.blob());
        cleanup.current = url;
        setState({ status: "image", url });
      } else if (type === "text/html" || type === "application/xhtml+xml") {
        // A web page where a file was expected = the request reached the website instead of the API (wrong address / proxy).
        throw new Error("The server returned a web page instead of the file. The app is probably contacting the wrong server address; please tell the administrator.");
      } else if (type.startsWith("text/")) {
        setState({ status: "text", text: (await res.text()).slice(0, 500000) });
      } else {
        throw new Error("This file format cannot be viewed in the app.");
      }
    } catch (e) {
      if (e?.name === "AbortError") return;           // superseded by a newer load / unmounted: not an error
      setState({ status: "error", message: e.message || "This file could not be opened." });
      if (onError) onError(e);
    }
  }, [src, onError]);

  useEffect(() => {
    const ctl = new AbortController();
    load(ctl.signal);
    return () => {
      ctl.abort();
      if (cleanup.current) { URL.revokeObjectURL(cleanup.current); cleanup.current = null; }
    };
  }, [load]);

  const block = (e) => e.preventDefault();
  return (
    <div className="docv" onContextMenu={block} onDragStart={block} aria-label={title}>
      {state.status === "loading" && <p className="docv-msg">Opening document…</p>}
      {state.status === "error" && <p className="docv-msg docv-msg--error" role="alert">{state.message}</p>}
      {state.status === "pdf" && <PdfView data={state.data} />}
      {state.status === "image" && <div className="docv-scroll docv-image"><img src={state.url} alt={title} draggable={false} /></div>}
      {state.status === "text" && <pre className="docv-text docv-scroll">{state.text}</pre>}
    </div>
  );
}

/** Full-screen (mobile) / large (desktop) modal around the viewer. */
export function DocumentModal({ open, title, src, onClose }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="docv-modal" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className="docv-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="docv-modal-head">
          <strong>{title}</strong>
          <button type="button" className="ghost-button" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <DocumentViewer src={src} title={title} />
      </div>
    </div>
  );
}
