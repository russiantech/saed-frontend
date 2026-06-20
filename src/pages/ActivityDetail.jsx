import { ArrowLeft, Compass } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import activities from "../data/activities";
import FloatingNav from "../components/FloatingNav.jsx";

export default function ActivityDetail() {
  const { id } = useParams();
  const activity = activities.find((item) => item.id === id);

  if (!activity) {
    return (
      <div className="site-page">
        <FloatingNav />
        <section className="activities-section">
          <div className="section-heading">
            <h2>Activity not found</h2>
            <p>The activity you are looking for does not exist.</p>
            <Link className="primary-button" to="/activities">
              <ArrowLeft size={16} /> Back to Camp Activities
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="site-page">
      <FloatingNav />
      <section className="activity-detail-section">
        <Link className="back-link" to="/activities">
          <ArrowLeft size={16} /> Back to Camp Activities
        </Link>

        <div className="activity-detail-hero">
          <img src={activity.image} alt={activity.title} />
          <div className="activity-detail-hero-body">
            <h1>{activity.title}</h1>
            <p>{activity.description}</p>
          </div>
        </div>

        {activity.images && activity.images.length ? (
          <div className="activity-gallery" aria-label={`${activity.title} photo gallery`}>
            {activity.images.map((src, index) => (
              <figure className="activity-gallery-item" key={src}>
                <img src={src} alt={`${activity.title} photo ${index + 1}`} loading="lazy" />
              </figure>
            ))}
          </div>
        ) : null}

        {activity.exploreHref ? (
          <div className="activity-detail-footer">
            <Link className="primary-button activity-explore-cta" to={activity.exploreHref}>
              <Compass size={16} /> Explore Programs
            </Link>
          </div>
        ) : null}
      </section>
    </div>
  );
}
