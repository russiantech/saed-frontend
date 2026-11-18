import { useCallback, useEffect, useState } from "react";
import { Download } from "lucide-react";

import { api, API_BASE_URL } from "lib/api.js";
import { fmtDate, STREAM_STATUS_LABEL } from "lib/track.js";
import useStreams from "hooks/useStreams.js";
import "styles/trainer.css";

const Stat = ({ label, value, hint }) => (
  <article className="stat-card"><span>{label}</span><strong>{value}</strong>{hint && <small className="form-hint">{hint}</small>}</article>
);

const Bars = ({ rows, label, empty = "No data yet." }) => {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return rows.length === 0 ? <p className="form-hint">{empty}</p> : (
    <ul className="rp-bars">
      {rows.map((r) => (
        <li key={r[label]}><span>{r.label || r[label]}</span>
          <div className="rp-bar"><i style={{ width: `${(r.count / max) * 100}%` }} /></div><b>{r.count}</b></li>
      ))}
    </ul>
  );
};

/** Per-stream report on corps members, trainers, proposals and engagement, plus a separate Post-Camp summary. */
export default function Reports() {
  const { streams, years } = useStreams();
  const [streamId, setStreamId] = useState("");
  const [year, setYear] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const qs = new URLSearchParams();
    if (streamId) qs.set("streamId", streamId); else if (year) qs.set("year", year);
    try { setData(await api(`/reports/streams/${qs.toString() ? `?${qs}` : ""}`)); setError(""); }
    catch (e) { setError(e.message); }
  }, [streamId, year]);
  useEffect(() => { load(); }, [load]);

  const exportUrl = (kind) => `${API_BASE_URL}/reports/streams/export/?kind=${kind}${streamId ? `&streamId=${streamId}` : ""}`;
  const visible = (streams || []).filter((s) => !year || String(s.year) === year);

  return (
    <section className="panel tr-section">
      <div className="tr-head">
        <div><h2>Reports</h2><p className="form-hint">Everything is per stream. Filter by year or stream; export the lists as CSV.</p></div>
        <div className="tr-actions">
          {["corpers", "trainers", "courses"].map((k) => (
            <a key={k} className="ghost-button small" href={exportUrl(k)} download><Download size={14} /> {k === "corpers" ? "Corps members" : k === "trainers" ? "Trainers" : "Courses"} CSV</a>
          ))}
        </div>
      </div>
      <div className="tr-filters">
        <label>Year
          <select value={year} onChange={(e) => { setYear(e.target.value); setStreamId(""); }} aria-label="Filter by year">
            <option value="">All years</option>{years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
        <label>Stream
          <select value={streamId} onChange={(e) => setStreamId(e.target.value)} aria-label="Filter by stream">
            <option value="">All streams{year ? ` in ${year}` : ""}</option>
            {visible.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
      </div>

      {error && <p className="inline-message error" role="alert">{error}</p>}
      {!data ? <p className="form-hint">Loading…</p> : (
        <>
          <h3>In-Camp totals</h3>
          <div className="stat-grid">
            <Stat label="Corps members" value={data.totals.corpers} hint={`${data.totals.activeCorpers} active`} />
            <Stat label="Trainers" value={data.totals.trainers} hint={`${data.totals.activeTrainers} active`} />
            <Stat label="Courses" value={data.totals.courses} hint={`${data.totals.pendingProposals} pending review`} />
            <Stat label="Enrolments" value={data.totals.enrolments} />
          </div>

          {data.streams.length === 0 && <div className="empty-state"><h3>No streams match</h3></div>}
          {data.streams.map((r) => (
            <article key={r.stream.id} className="rp-stream">
              <header>
                <h3>{r.stream.name}</h3>
                <span className="form-hint">{fmtDate(r.stream.startDate)} – {fmtDate(r.stream.endDate)} · accounts end {fmtDate(r.stream.deactivationDate)}</span>
                <span className={`cp-badge ${["running", "upcoming"].includes(r.stream.status) ? "cp-badge--ok" : ""}`}>{STREAM_STATUS_LABEL[r.stream.status]}</span>
              </header>
              <div className="stat-grid">
                <Stat label="Corps members" value={r.corpers.total} hint={`${r.corpers.active} active · ${r.corpers.expired} expired`} />
                <Stat label="Enrolled in a course" value={r.corpers.withEnrolment} hint={`${r.corpers.withoutEnrolment} not yet`} />
                <Stat label="Trainers" value={r.trainers.total} hint={`${r.trainers.active} active · ${r.trainers.expired} expired`} />
                <Stat label="Trainers with proposals" value={r.trainers.withProposals} hint={`${r.trainers.withoutProposals} none yet`} />
                <Stat label="Courses" value={r.courses.total} hint={`${r.courses.approved} open · ${r.courses.pending} pending · ${r.courses.declined} declined`} />
                <Stat label="Enrolments" value={r.courses.enrolments} hint={`${r.courses.lessons} lessons · ${r.courses.lessonCompletions} completed`} />
              </div>
              <div className="rp-cols">
                <div><h4>Corps members by skill</h4><Bars rows={r.corpers.bySkill} label="skill" /></div>
                <div><h4>Corps members by camp</h4><Bars rows={r.corpers.byCamp} label="camp" /></div>
                <div><h4>Trainers by skill</h4><Bars rows={r.trainers.bySkill} label="skill" /></div>
                <div><h4>Top courses</h4>
                  {r.topCourses.length === 0 ? <p className="form-hint">No open courses yet.</p> : (
                    <ol className="rp-top">{r.topCourses.map((c) => <li key={c.id}><span>{c.title}<small className="form-hint"> {c.trainer}</small></span><b>{c.enrolled}</b></li>)}</ol>
                  )}
                </div>
              </div>
            </article>
          ))}

          <h3>Post-Camp (separate programme)</h3>
          <div className="stat-grid">
            <Stat label="Corps members" value={data.postCamp.corpers.total} />
            <Stat label="Trainers" value={data.postCamp.trainers.total} hint={`${data.postCamp.trainers.approved} approved · ${data.postCamp.trainers.pending} pending`} />
            <Stat label="Courses" value={data.postCamp.courses.total} hint={`${data.postCamp.courses.published} published`} />
            <Stat label="Enrolments" value={data.postCamp.courses.enrolments} />
          </div>
        </>
      )}
    </section>
  );
}
