import { Search, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useMatch, useNavigate } from "react-router-dom";

import FloatingNav from "../../components/layout/FloatingNav.jsx";

import { api } from "../../lib/api.js";
import { useAuth } from "../../lib/auth.jsx";

function firstSentence(text) {
  if (!text) return "";
  const match = text.match(/^[^.]+\./);
  return match ? match[0] : text.slice(0, 120) + (text.length > 120 ? "\u2026" : "");
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
  { value: "green_energy_satellite_security", label: "Green Energy & Satellite Security" },
  { value: "ict", label: "ICT" },
  { value: "cosmetology", label: "Cosmetology" },
  { value: "education", label: "Education" },
];

function categoryLabel(val) {
  return (val || "").replace(/_/g, " ");
}

export default function Programs() {
  const navigate = useNavigate();
  const inApp = !!useMatch({ path: "/app/*" });
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [skillFilter, setSkillFilter] = useState("all");
  const [lgaFilter, setLgaFilter] = useState("all");
  const [query, setQuery] = useState("");
  const isTrainer = user?.role === "trainer";

  useEffect(() => {
    async function load() {
      try {
        const endpoint = inApp && isTrainer ? "/manage/programs/" : "/programs/";
        const data = await api(endpoint);
        setItems(data.programs || []);
        setLoadError("");
      } catch (err) {
        setItems([]);
        setLoadError(err.message || "Failed to load courses.");
      }
    }
    load();
  }, [inApp, isTrainer]);

  const lgaOptions = useMemo(() => {
    const locations = [...new Set(items.map((p) => p.location).filter(Boolean))].sort();
    return [{ value: "all", label: "All LGAs" }, ...locations.map((l) => ({ value: l, label: l }))];
  }, [items]);

  const visibleItems = useMemo(
    () =>
      items.filter((item) => {
        const matchesSkill = skillFilter === "all" || item.category === skillFilter;
        const matchesLga = lgaFilter === "all" || item.location === lgaFilter;
        const matchesQuery = `${item.title} ${item.description || ""} ${item.location || ""} ${categoryLabel(item.category)} ${item.trainerName || ""}`
          .toLowerCase()
          .includes(query.toLowerCase());
        return matchesSkill && matchesLga && matchesQuery;
      }),
    [items, skillFilter, lgaFilter, query],
  );

  const detailsHref = (item) => {
    return inApp ? `/app/programs/${item.id}` : `/programs/${item.id}`;
  };

  const content = (
    <section className="panel full-panel">
      <div className="panel-heading">
        <div>
          <h2>{isTrainer && inApp ? "My Courses" : "SAED Courses"}</h2>
          <p>{isTrainer && inApp ? "View the SAED courses you are teaching." : "Browse active courses."}</p>
        </div>
      </div>

      <div className="course-toolbar">
        <div className="search-box">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search courses or trainers" />
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

      {loadError && (
        <div className="inline-message inline-message--error" style={{ margin: "0 16px" }}>
          {loadError}
        </div>
      )}

      <div className="course-card-grid">
        {visibleItems.length ? visibleItems.map((item) => {
          const price = Number(item.price);
          return (
            <article className={`course-card ${item.isRestricted ? "restricted" : ""}`} key={item.id}>
              <span className="category-label">{categoryLabel(item.category)}</span>
              {item.isRestricted && <span className="status-badge restricted">Restricted</span>}
              <h3>{item.title}</h3>
              <p>{firstSentence(item.description)}</p>
              <dl>
                <div><dt>Duration</dt><dd>{item.durationWeeks} weeks</dd></div>
                <div><dt>Trainer</dt><dd>{item.trainerName}</dd></div>
                <div><dt>Price</dt><dd>{price === 0 ? "Free" : `\u20a6${price.toLocaleString()}`}</dd></div>
                <div><dt>Starts</dt><dd>{item.startDate ? new Date(item.startDate).toLocaleDateString() : "\u2014"}</dd></div>
              </dl>
              <button
                className="primary-button"
                onClick={() => navigate(detailsHref(item))}
                type="button"
              >
                View Details
              </button>
            </article>
          );
        }) : (
          <div className="empty-state course-empty-state">
            <p>{isTrainer && inApp ? "No courses are assigned to you yet." : "No active courses match your search."}</p>
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
