import { Link } from "react-router-dom";

export default function ConnectionSuccess() {
  return (
    <div className="page-container">
      <div className="success-icon">✓</div>
      <h1>Connection Request Sent!</h1>
      <p className="page-subtitle">Your trainer will receive your connection request and respond within 24 hours.</p>

      <div className="success-card">
        <h3>WHAT HAPPENS NEXT</h3>
        <ul>
          <li>Check your email for a welcome message from your trainer</li>
          <li>Enroll in courses available for your skill area</li>
          <li>Attend your first training session (dates shared by trainer)</li>
        </ul>
      </div>

      <Link to="/app" className="wide-button">→ Go to Dashboard</Link>
    </div>
  );
}
