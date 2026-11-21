import { useState } from "react";

/** <img> that shows a neat placeholder (instead of a broken-image icon) when the file cannot be loaded. */
export default function SafeImage({ src, alt = "", className = "", ...rest }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return <div className={`safe-image-fallback ${className}`} role="img" aria-label={alt}><span>{alt}</span></div>;
  }
  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} {...rest} />;
}
