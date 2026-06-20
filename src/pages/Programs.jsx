import { Search, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useMatch, useNavigate } from "react-router-dom";

import FloatingNav from "../components/FloatingNav.jsx";

import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";

function firstSentence(text) {
  if (!text) return "";
  const match = text.match(/^[^.]+\./);
  return match ? match[0] : text.slice(0, 120) + (text.length > 120 ? "…" : "");
}

const skillOptions = [
  { value: "all", label: "All Skills" },
  { value: "creative_industry", label: "Creative Industry" },
  { value: "automobile", label: "Automobile" },
  { value: "construction", label: "Construction" },
  { value: "agro_allied", label: "Agro-Allied" },
  { value: "delivery_logistics", label: "Delivery & Logistics" },
  { value: "culinary_catering", label: "Culinary & Catering" },
  { value: "cleaning_services", label: "Cleaning Services" },
  { value: "green_energy", label: "Green Energy" },
  { value: "satellite_security", label: "Satellite & Security Technology" },
  { value: "ict", label: "ICT" },
  { value: "cosmetology", label: "Cosmetology" },
  { value: "education", label: "Education" },
];

function categoryLabel(programCategory) {
  return programCategory.replace(/_/g, " ");
}

export default function Programs() {
  const navigate = useNavigate();
  const inApp = !!useMatch({ path: "/app/*" });
  const { user } = useAuth();
  const [programs, setPrograms] = useState([]);
  const [skillFilter, setSkillFilter] = useState("all");
  const [lgaFilter, setLgaFilter] = useState("all");
  const [query, setQuery] = useState("");
  const isTrainer = user?.role === "trainer";

  useEffect(() => {
    async function load() {
      try {
        const programData = await api(inApp && isTrainer ? "/manage/programs/" : "/programs/");
        setPrograms(programData.programs || []);
      } catch {
        setPrograms([]);
      }
    }
    load();
  }, [inApp, isTrainer]);

  const lgaOptions = useMemo(() => {
    const locations = [...new Set(programs.map((p) => p.location).filter(Boolean))].sort();
    return [{ value: "all", label: "All LGAs" }, ...locations.map((l) => ({ value: l, label: l }))];
  }, [programs]);

  const visiblePrograms = useMemo(
    () =>
      programs.filter((program) => {
        const activeSkillLabel = skillOptions.find((o) => o.value === skillFilter)?.label || "";
        const matchesSkill = skillFilter === "all" || program.category === activeSkillLabel;
        const matchesLga = lgaFilter === "all" || program.location === lgaFilter;
        const matchesQuery = `${program.title} ${program.description} ${program.location} ${categoryLabel(program.category)} ${program.trainerName || ""}`
          .toLowerCase()
          .includes(query.toLowerCase());
        return matchesSkill && matchesLga && matchesQuery;
      }),
    [programs, skillFilter, lgaFilter, query],
  );

  const detailsHref = (programId) => (inApp ? `/app/programs/${programId}` : `/programs/${programId}`);

  const content = (
    <section className="panel full-panel">
      <div className="panel-heading">
        <div>
          <h2>{isTrainer && inApp ? "Programs Being Taught" : "SAED Programs"}</h2>
          <p>{isTrainer && inApp ? "View the SAED programs assigned to you." : "Browse active training tracks and submit your interest."}</p>
        </div>
      </div>

      <div className="program-toolbar">
        <div className="search-box">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search programs or trainers" />
        </div>
        <div className="filter-dropdowns">
          <div className="select-wrapper">
            <select value={skillFilter} onChange={(e) => setSkillFilter(e.target.value)}>
              {skillOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="select-icon" />
          </div>
          <div className="select-wrapper">
            <select value={lgaFilter} onChange={(e) => setLgaFilter(e.target.value)}>
              {lgaOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="select-icon" />
          </div>
        </div>
      </div>

      <div className="program-card-grid">
        {visiblePrograms.length ? visiblePrograms.map((program) => {
          return (
            <article className={`program-card ${program.isRestricted ? "restricted" : ""}`} key={program.id}>
              <span className="category-label">{categoryLabel(program.category)}</span>
              <h3>{program.title}</h3>
              {program.isRestricted && <span className="status-badge restricted">Restricted</span>}
              <p>{firstSentence(program.description)}</p>
              <dl>
                <div><dt>Duration</dt><dd>{program.durationWeeks} weeks</dd></div>
                <div><dt>Location</dt><dd>{program.location}</dd></div>
                <div><dt>Trainer</dt><dd>{program.trainerName}</dd></div>
                <div><dt>Slots</dt><dd>{program.availableSlots}</dd></div>
              </dl>
              <button
                className="primary-button"
                onClick={() => navigate(detailsHref(program.id))}
                type="button"
              >
                View Details
              </button>
            </article>
          );
        }) : (
          <div className="empty-state program-empty-state">
            <p>{isTrainer && inApp ? "No programs are assigned to you yet." : "No active programs match your search."}</p>
          </div>
        )}
      </div>
    </section>
  );

  if (inApp) return content;
  return (
    <div className="site-page">
      <FloatingNav />
      {content}
    </div>
  );
}
