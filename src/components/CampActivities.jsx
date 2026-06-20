import { Link } from "react-router-dom";

import activities from "../data/activities";

function firstSentence(text) {
  if (!text) return "";
  const match = text.match(/^[^.]+\./);
  return match ? match[0] : text.slice(0, 120) + (text.length > 120 ? "…" : "");
}

export default function CampActivities() {
  return (
    <section className="activities-section" id="activities">
      <div className="section-heading">
        <h2>Camp Activities</h2>
        <p>Activities commonly held at NYSC Orientation Camp.</p>
      </div>
      <div className="activities-grid">
        {activities.map((a) => (
          <article key={a.id} className="activity-card">
            <img src={a.image} alt={a.title} />
            <div className="card-body">
              <h3>{a.title}</h3>
              <p>{firstSentence(a.description)}</p>
              <Link
                className="primary-button activity-learn-more"
                to={`/activities/${a.id}`}
              >
                Learn More
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
