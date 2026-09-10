import { Link, useSearchParams } from "react-router-dom";
import AuthLayout from "components/auth/AuthLayout.jsx";

export default function CheckInbox() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");

  return (
    <AuthLayout title="Check Your Inbox">
      <div className="success-message">
        <div className="success-icon">✉</div>
        <h2>Verification Email Sent!</h2>
        <p>
          We've sent a verification link to{" "}
          <strong>{email || "your email address"}</strong>.
        </p>
        <p>
          Please check your inbox and click the link to verify your account.
          You won't be able to log in until your email is verified.
        </p>
        <Link to="/login" className="primary-button">
          Go to Login
        </Link>
      </div>
    </AuthLayout>
  );
}
