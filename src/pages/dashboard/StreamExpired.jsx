import { CalendarX } from "lucide-react";
import { Link } from "react-router-dom";
import { fmtDate } from "lib/track.js";

/** Replaces the portal once an In-Camp stream has ended: the account (and dashboard) is deactivated. */
export default function StreamExpired({ lifecycle, role }) {
  const s = lifecycle?.stream;
  const none = lifecycle?.state === "none";
  const deactivated = lifecycle?.reason === "deactivated";
  return (
    <section className="panel stream-expired" role="status">
      <CalendarX size={40} aria-hidden="true" />
      <h2>{none ? "No stream yet" : deactivated ? "Your In-Camp account was deactivated" : "Your In-Camp stream has ended"}</h2>
      {none ? (
        <p>Your In-Camp account is not attached to a stream yet. Please contact SAED admin.</p>
      ) : (
        <p>
          {s?.name} {deactivated ? "access was switched off by SAED admin" : `ended on ${fmtDate(s?.endDate)}`}, so this {role === "trainer" ? "trainer" : "corps member"} account
          is deactivated and the In-Camp dashboard is closed.
          {role === "trainer" ? " If you are admitted to another stream, SAED admin can re-activate your account." : " Thank you for taking part."}
        </p>
      )}
      <div className="quick-actions">
        <Link className="ghost-button" to="/app/notifications">Notifications</Link>
        <Link className="ghost-button" to="/app/profile">My profile</Link>
      </div>
    </section>
  );
}
