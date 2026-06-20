import { BriefcaseBusiness, GraduationCap, Handshake } from "lucide-react";
import { Link } from "react-router-dom";
import FloatingNav from "../components/FloatingNav.jsx";

export default function Home() {
  return (
    <div className="site-page">
      <FloatingNav />

      <section className="hero">
        <div className="hero-overlay">
          <div className="hero-content">
            <h1>Learn Practical Skills That Prepare You for Life After NYSC</h1>
            <p>Explore SAED programs, career resources, and opportunities designed to help corps members succeed beyond service year.</p>
            <div className="hero-actions">
              <Link className="primary-button" to="/signup">Get Started</Link>
              <Link className="secondary-button" to="/programs">Explore Programs</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-band">
        <div><strong>5,000+</strong><span>Corps Members</span></div>
        <div><strong>120+</strong><span>SAED Programs</span></div>
        <div><strong>98%</strong><span>Success Rate</span></div>
      </section>

      <section className="feature-section" id="explore">
        <div className="section-heading">
          <h2>Everything You Need to Succeed</h2>
          <p>NYSC SAED gives you the tools, skills, and connections for life after service.</p>
        </div>
        <div className="feature-grid">
          <article>
            <GraduationCap size={34} />
            <h3>Skill Acquisition</h3>
            <p>Access hands-on training programs in tech, agriculture, business, and more.</p>
          </article>
          <article>
            <Handshake size={34} />
            <h3>Mentorship</h3>
            <p>Connect with trainers and industry professionals who guide your journey.</p>
          </article>
          <article>
            <BriefcaseBusiness size={34} />
            <h3>Opportunities</h3>
            <p>Discover jobs, grants, and business resources tailored for NYSC corps members.</p>
          </article>
        </div>
      </section>

      <footer className="site-footer">© 2026 DUNIS TECHNOLOGIES LIMITED. All rights reserved.</footer>
    </div>
  );
}
