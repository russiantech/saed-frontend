import { CalendarClock } from "lucide-react";
import { fmtDate, daysLabel } from "lib/track.js";

/** Shows an In-Camp account's stream window so people always know when their account ends. */
export default function StreamBanner({ lifecycle }) {
  if (!lifecycle || lifecycle.track !== "in_camp" || !lifecycle.isActive || !lifecycle.stream) return null;
  const s = lifecycle.stream;
  const days = lifecycle.daysRemaining;
  const soon = days !== null && days !== undefined && days <= 3;
  return (
    <aside className={`stream-banner ${soon ? "stream-banner--soon" : ""}`} role="status" aria-label="Stream duration">
      <CalendarClock size={18} aria-hidden="true" />
      <div>
        <strong>{s.name}</strong>
        <span>
          {lifecycle.state === "upcoming"
            ? `Starts ${fmtDate(s.startDate)} (in ${lifecycle.daysToStart} day${lifecycle.daysToStart === 1 ? "" : "s"})`
            : `${fmtDate(s.startDate)} – ${fmtDate(s.endDate)}`}
          {" · "}Your account is active until {fmtDate(s.deactivationDate)}
        </span>
      </div>
      <b>{daysLabel(days)}</b>
    </aside>
  );
}
