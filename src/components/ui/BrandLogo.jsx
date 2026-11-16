/** The NYSC emblem. Replace frontend/public/logo.png (or set VITE_LOGO_URL) to change it everywhere. */
const LOGO = import.meta.env.VITE_LOGO_URL || "/logo.png";

export default function BrandLogo({ size = 44, className = "", alt = "NYSC SAED" }) {
  return (
    <img
      src={LOGO}
      alt={alt}
      width={size}
      height={size}
      className={`brand-logo ${className}`}
      style={{ width: size, height: size, objectFit: "contain" }}
      draggable={false}
    />
  );
}
