import { Link } from "react-router-dom";
import { Tent, GraduationCap } from "lucide-react";
import AuthLayout from "components/auth/AuthLayout.jsx";

/** Entry point for /signup: In-Camp and Post-Camp are different programmes with their own sign-up. */
export default function SignupChooser() {
  return (
    <AuthLayout title="Create Your Account" subtitle="Choose the SAED programme you belong to">
      <div className="track-choices">
        <Link to="/signup/in-camp" className="track-card track-card--in">
          <Tent size={28} aria-hidden="true" />
          <strong>In-Camp SAED</strong>
          <span>For corps members currently in an orientation camp stream. Your account runs for the length of your stream.</span>
        </Link>
        <Link to="/signup/post-camp" className="track-card track-card--post">
          <GraduationCap size={28} aria-hidden="true" />
          <strong>Post-Camp SAED</strong>
          <span>For corps members after camp and for trainers. Learn at your own pace and connect with trainers.</span>
        </Link>
      </div>
      <p className="auth-switch">Already have an account? <Link to="/login">Login here</Link></p>
    </AuthLayout>
  );
}
