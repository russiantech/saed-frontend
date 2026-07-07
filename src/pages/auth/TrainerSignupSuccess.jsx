import { Link } from "react-router-dom";
import AuthLayout from "components/auth/AuthLayout.jsx";

export default function TrainerSignupSuccess() {
  return (
    <AuthLayout  title="Application Submitted">
      <div className="success-message">
        <div className="success-icon">✓</div>
        <h2>Thank You for Applying!</h2>
        <p>Your trainer application has been received and is under review.</p>
        <p>Please check your email and verify your email address to complete registration.</p>
        <p>You will receive another email once your account is approved.</p>
        <Link to="/" className="primary-button">Back to Home</Link>
      </div>
    </AuthLayout>
  );
}
