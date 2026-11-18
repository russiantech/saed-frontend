import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";

import AppShell from "./components/layout/AppShell.jsx";
import { trackOf } from "./lib/track.js";
import { AuthProvider, useAuth } from "./lib/auth.jsx";

// Auth pages
import Login from "./pages/auth/Login.jsx";
import Signup from "./pages/auth/Signup.jsx";
import SignupChooser from "./pages/auth/SignupChooser.jsx";
import ForgotPassword from "./pages/auth/ForgotPassword.jsx";
import VerifyEmail from "./pages/auth/VerifyEmail.jsx";
import InactiveAccountPage from "./pages/corper/InactiveAccountPage.jsx";
import TrainerSignupSuccess from "./pages/auth/TrainerSignupSuccess.jsx";
import AdminSignup from "./pages/auth/AdminSignup.jsx";

// Public pages
import Home from "./pages/public/Home.jsx";
import Activities from "./pages/public/Activities.jsx";
import ActivityDetail from "./pages/public/ActivityDetail.jsx";
import Opportunities from "./pages/public/Opportunities.jsx";
import Programs from "./pages/public/Programs.jsx";
import ProgramDetail from "./pages/public/ProgramDetail.jsx";

// Dashboard pages
import Dashboard from "./pages/dashboard/Dashboard.jsx";
import AdminDashboard from "./pages/dashboard/AdminDashboard.jsx";

// Corps member pages
import Courses from "./pages/corper/Courses.jsx";
import MyEnrollments from "./pages/corper/MyEnrollments.jsx";
import InCampSaed from "./pages/corper/InCampSaed.jsx";
import Trainers from "./pages/corper/Trainers.jsx";
import PaymentCallback from "./pages/corper/PaymentCallback.jsx";

// Shared course page (catalogue detail, in-app lessons)
import CourseView from "./pages/courses/CourseView.jsx";

// Trainer pages
import MyCourses from "./pages/trainer/MyCourses.jsx";
import CourseEditor from "./pages/trainer/CourseEditor.jsx";
import CorpsMembers from "./pages/trainer/CorpsMembers.jsx";
import CorperProfile from "./pages/trainer/CorperProfile.jsx";
import Earnings from "./pages/trainer/Earnings.jsx";

// Admin pages
import ManageUsers from "./pages/admin/ManageUsers.jsx";
import ManageApplications from "./pages/admin/ManageApplications.jsx";
import ProgramEditor from "./pages/admin/ProgramEditor.jsx";
import AdminCourses from "./pages/admin/AdminCourses.jsx";
import DunisAdmin from "./pages/admin/DunisAdmin.jsx";
import OrientationCamps from "./pages/admin/OrientationCamps.jsx";
import Streams from "./pages/admin/Streams.jsx";
import StreamTrainers from "./pages/admin/StreamTrainers.jsx";
import Proposals from "./pages/admin/Proposals.jsx";
import Reports from "./pages/admin/Reports.jsx";

// Form pages
import SaedQuestionForm from "./pages/forms/SaedQuestionForm.jsx";
import DunisComplaintForm from "./pages/forms/DunisComplaintForm.jsx";

// Profile pages
import Notifications from "./pages/profile/Notifications.jsx";
import EditProfile from "./pages/profile/EditProfile.jsx";
import Profile from "./pages/profile/Profile.jsx";

import "./styles.css";
import "./styles/tracks.css";
import "./styles/forms.css"; // keep last: unified form/control system

// Apply saved or system preference theme immediately
try {
  const saved = localStorage.getItem("saed_dark");
  if (saved !== null) {
    document.documentElement.classList.toggle("dark", saved === "true");
  } else if (window.matchMedia) {
    document.documentElement.classList.toggle(
      "dark",
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  }
} catch (err) {
  // ignore
}

function homePathForRole(role) {
  if (role === "dunis_admin") return "/app/dunis-admin";
  return "/app/dashboard";
}

function LegacyCourseRedirect() {
  const { id } = useParams();
  return <Navigate to={`/app/courses/${id}`} replace />;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function ProtectedRoute({ children, roles, track }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="screen-loader">Loading SAED IMS...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={homePathForRole(user.role)} replace />;
  }
  // In-Camp and Post-Camp are separate programmes: an account only reaches its own pages.
  const mine = trackOf(user);
  if (track && mine && mine !== track) return <Navigate to="/app/dashboard" replace />;
  return children;
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/activities" element={<Activities />} />
          <Route path="/activities/:id" element={<ActivityDetail />} />
          <Route path="/opportunities" element={<Opportunities />} />
          <Route path="/programs" element={<Programs />} />
          <Route path="/programs/:id" element={<ProgramDetail />} />

          {/* Auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignupChooser />} />
          <Route path="/signup/in-camp" element={<Signup track="in_camp" />} />
          <Route path="/signup/post-camp" element={<Signup track="post_camp" />} />
          <Route path="/forgot" element={<ForgotPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/trainer-signup-success" element={<TrainerSignupSuccess />} />
          <Route path="/x9k2m-admin" element={<AdminSignup />} />
          <Route path="/d9x7k-admin" element={<AdminSignup />} />

          {/* Admin routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute roles={["saed_admin", "dunis_admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Form routes - require authentication */}
          <Route
            path="/saed-question"
            element={
              <ProtectedRoute>
                <SaedQuestionForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dunis-complaint"
            element={
              <ProtectedRoute>
                <DunisComplaintForm />
              </ProtectedRoute>
            }
          />

          {/* Inactive account page (outside AppShell so it renders for inactive trainers) */}
          <Route path="/app/inactive-account" element={
            <ProtectedRoute><InactiveAccountPage /></ProtectedRoute>
          } />

          {/* Payment callback (outside AppShell so verification works cleanly) */}
          <Route path="/app/payment/callback" element={
            <ProtectedRoute><PaymentCallback /></ProtectedRoute>
          } />

          {/* App shell with protected routes */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />

            {/* Corps member routes */}
            <Route path="courses" element={<ProtectedRoute roles={["corps_member"]} track="post_camp"><Courses /></ProtectedRoute>} />
            <Route path="incamp" element={<ProtectedRoute roles={["corps_member", "trainer"]} track="in_camp"><InCampSaed /></ProtectedRoute>} />
            <Route path="my-enrollments" element={<ProtectedRoute roles={["corps_member"]}><MyEnrollments /></ProtectedRoute>} />
            <Route path="trainers" element={<ProtectedRoute roles={["corps_member"]} track="post_camp"><Trainers /></ProtectedRoute>} />
            <Route path="trainers/:trainerId" element={<ProtectedRoute roles={["corps_member"]} track="post_camp"><Trainers /></ProtectedRoute>} />

            {/* Trainer routes */}
            <Route path="my-courses" element={<ProtectedRoute roles={["trainer"]}><MyCourses /></ProtectedRoute>} />
            <Route path="my-courses/:courseId" element={<ProtectedRoute roles={["trainer"]}><CourseEditor /></ProtectedRoute>} />
            <Route path="incamp-sessions" element={<Navigate to="/app/incamp" replace />} />
            <Route path="corps-members" element={<ProtectedRoute roles={["trainer"]}><CorpsMembers /></ProtectedRoute>} />
            <Route path="corps-members/:corperId" element={<ProtectedRoute roles={["trainer"]}><CorperProfile /></ProtectedRoute>} />
            <Route path="earnings" element={<ProtectedRoute roles={["trainer"]} track="post_camp"><Earnings /></ProtectedRoute>} />

            {/* Admin routes inside app */}
            <Route path="manage-applications" element={<ProtectedRoute roles={["saed_admin", "dunis_admin", "trainer"]}><ManageApplications /></ProtectedRoute>} />
            <Route path="admin-courses" element={<ProtectedRoute roles={["saed_admin", "dunis_admin"]}><AdminCourses /></ProtectedRoute>} />
            <Route path="program-editor" element={<ProtectedRoute roles={["saed_admin", "dunis_admin"]}><ProgramEditor /></ProtectedRoute>} />
            <Route path="users" element={<ProtectedRoute roles={["saed_admin", "dunis_admin"]}><ManageUsers /></ProtectedRoute>} />
            <Route path="dunis-admin" element={<ProtectedRoute roles={["dunis_admin"]}><DunisAdmin /></ProtectedRoute>} />

            {/* Legacy URLs (old emails, bookmarks) */}
            <Route path="programs" element={<Navigate to="/app/courses" replace />} />
            <Route path="programs/:id" element={<LegacyCourseRedirect />} />
            <Route path="applications" element={<Navigate to="/app/my-enrollments" replace />} />
            <Route path="my-trainers" element={<Navigate to="/app/trainers" replace />} />
            <Route path="course-management" element={<Navigate to="/app/my-courses" replace />} />
            <Route path="my-corpers" element={<Navigate to="/app/corps-members" replace />} />
            <Route path="trainee-fast-track" element={<Navigate to="/app/courses" replace />} />
            <Route path="camps" element={<ProtectedRoute roles={["saed_admin", "dunis_admin"]}><OrientationCamps /></ProtectedRoute>} />
            <Route path="streams" element={<ProtectedRoute roles={["saed_admin", "dunis_admin"]}><Streams /></ProtectedRoute>} />
            <Route path="stream-trainers" element={<ProtectedRoute roles={["saed_admin", "dunis_admin"]}><StreamTrainers /></ProtectedRoute>} />
            <Route path="proposals" element={<ProtectedRoute roles={["saed_admin", "dunis_admin"]}><Proposals /></ProtectedRoute>} />
            <Route path="reports" element={<ProtectedRoute roles={["saed_admin", "dunis_admin"]}><Reports /></ProtectedRoute>} />
            <Route path="orientation-camps" element={<Navigate to="/app/camps" replace />} />

            {/* Shared routes */}
            <Route path="courses/:courseId" element={<CourseView />} />
            <Route path="notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
            <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<div className="empty-state"><h2>Page Not Found</h2><p>The page you are looking for does not exist.</p><a href="/" className="primary-button">Go Home</a></div>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
