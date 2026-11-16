import { FileText } from "lucide-react";

import { resolveMediaUrl } from "lib/api.js";
import DocumentViewer from "components/ui/LazyDocumentViewer.jsx";

function youtubeId(url = "") {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}
function vimeoId(url = "") {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}

/** In-app player/viewer for a lesson payload. Never links out to a raw file URL. */
export default function LessonMedia({ lesson }) {
  if (!lesson) return null;
  const { video, document: doc, textContent, title } = lesson;
  return (
    <div className="lesson-media" style={{ display: "grid", gap: 16 }}>
      {video && (
        <div style={{ background: "#000", borderRadius: 12, overflow: "hidden", aspectRatio: "16/9" }}>
          {video.mode === "external" ? (
            youtubeId(video.url) ? (
              <iframe title={title} src={`https://www.youtube.com/embed/${youtubeId(video.url)}`} style={{ width: "100%", height: "100%", border: 0 }}
                allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            ) : vimeoId(video.url) ? (
              <iframe title={title} src={`https://player.vimeo.com/video/${vimeoId(video.url)}`} style={{ width: "100%", height: "100%", border: 0 }} allowFullScreen />
            ) : (
              <video src={resolveMediaUrl(video.url)} controls controlsList="nodownload noremoteplayback" disablePictureInPicture style={{ width: "100%", height: "100%" }} onContextMenu={(e) => e.preventDefault()} />
            )
          ) : (
            <video src={resolveMediaUrl(video.url)} controls controlsList="nodownload noremoteplayback" disablePictureInPicture preload="metadata" style={{ width: "100%", height: "100%" }}
              onContextMenu={(e) => e.preventDefault()} />
          )}
        </div>
      )}

      {doc && doc.mode === "external" && (
        <div className="panel" style={{ padding: 16 }}>
          <FileText size={18} /> <strong>Document unavailable in the app</strong>
          <p style={{ fontSize: 13, color: "var(--muted)", margin: "6px 0 0" }}>This document was linked from an external site. Ask your trainer to upload it as a PDF so it opens here.</p>
        </div>
      )}
      {doc && doc.mode !== "external" && (
        <div className="docv--page" style={{ display: "flex", flexDirection: "column" }}>
          <DocumentViewer src={doc.url} title={doc.name || `${title} document`} />
          <p style={{ fontSize: 12, color: "var(--muted)", margin: "6px 0 0" }}><FileText size={12} style={{ verticalAlign: "middle" }} /> Viewing inside the app.</p>
        </div>
      )}

      {textContent && (
        <div style={{ padding: 16, background: "var(--surface-soft)", borderRadius: 10, whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{textContent}</div>
      )}

      {!video && !doc && !textContent && <p style={{ color: "var(--muted)" }}>The trainer hasn’t added content to this lesson yet.</p>}
    </div>
  );
}
