import { Link } from "react-router-dom";
import AuthLayout from "components/auth/AuthLayout.jsx";

export default function InactiveAccount() {
  return (
    <AuthLayout backLink="/login" title="Account Pending Approval">
      <div className="inactive-message">
        <p>Your trainer account is pending authorization.</p>
        <p>Please wait for an administrator to review and approve your application.</p>
        <p>You will receive an email notification once your account is activated.</p>
        <Link to="/" className="primary-button">Back to Home</Link>
      </div>
    </AuthLayout>
  );
}
