// In-Camp and Post-Camp are separate programmes inside one app. These helpers are the single place that decides
// which programme a signed-in account belongs to and how its stream window looks.

export function trackOf(user) {
  if (!user || (user.role !== "corps_member" && user.role !== "trainer")) return null;
  return user.track === "in_camp" || user.accountMode === "in_camp" ? "in_camp" : "post_camp";
}

export const isInCamp = (user) => trackOf(user) === "in_camp";

export function fmtDate(value) {
  if (!value) return "";
  const d = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function daysLabel(n) {
  if (n === null || n === undefined) return "";
  if (n === 0) return "last day";
  return `${n} day${n === 1 ? "" : "s"} left`;
}

export const STREAM_STATUS_LABEL = { upcoming: "Upcoming", running: "Running", grace: "Closing", ended: "Ended", closed: "Closed" };
