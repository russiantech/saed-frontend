import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import AppShell from "./components/layout/AppShell.jsx";
import BackHome from "./components/layout/BackHome.jsx";
import { AuthProvider, useAuth } from "./lib/auth.jsx";

// Auth pages
import Login from "./pages/auth/Login.jsx";
import Signup from "./pages/auth/Signup.jsx";
import ForgotPassword from "./pages/auth/ForgotPassword.jsx";
import VerifyEmail from "./pages/auth/VerifyEmail.jsx";
import InactiveAccount from "./pages/auth/InactiveAccount.jsx";
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

// Corper pages
import Applications from "./pages/corper/Applications.jsx";
import FindTrainers from "./pages/corper/FindTrainers.jsx";
import ConnectTrainer from "./pages/corper/ConnectTrainer.jsx";
import ConnectionSuccess from "./pages/corper/ConnectionSuccess.jsx";
import MyTrainers from "./pages/corper/MyTrainers.jsx";
import TraineeFastTrack from "./pages/corper/TraineeFastTrack.jsx";

// Trainer pages
import MyCorpers from "./pages/trainer/MyCorpers.jsx";
import CourseManagement from "./pages/trainer/CourseManagement.jsx";
import CourseDetail from "./pages/trainer/CourseDetail.jsx";
import FastTrackVideos from "./pages/trainer/FastTrackVideos.jsx";
import CorperProfile from "./pages/trainer/CorperProfile.jsx";

// Admin pages
import ManageUsers from "./pages/admin/ManageUsers.jsx";
import ManageApplications from "./pages/admin/ManageApplications.jsx";
import ProgramEditor from "./pages/admin/ProgramEditor.jsx";
import AdminCourses from "./pages/admin/AdminCourses.jsx";
import DunisAdmin from "./pages/admin/DunisAdmin.jsx";

// Form pages
import SaedQuestionForm from "./pages/forms/SaedQuestionForm.jsx";
import DunisComplaintForm from "./pages/forms/DunisComplaintForm.jsx";

// Profile pages
import Notifications from "./pages/profile/Notifications.jsx";
import EditProfile from "./pages/profile/EditProfile.jsx";
import Profile from "./pages/profile/Profile.jsx";

import "./styles.css";

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
  return "/app";
}

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="screen-loader">Loading SAED IMS...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={homePathForRole(user.role)} replace />;
  }
  return children;
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <BackHome />
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
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot" element={<ForgotPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/inactive-account" element={<InactiveAccount />} />
          <Route path="/trainer-signup-success" element={<TrainerSignupSuccess />} />
          <Route path="/x9k2m-admin" element={<AdminSignup />} />

          {/* Admin routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute roles={["saed_admin", "dunis_admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Form routes */}
          <Route path="/saed-question" element={<SaedQuestionForm />} />
          <Route path="/dunis-complaint" element={<DunisComplaintForm />} />

          {/* App shell with protected routes */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="programs" element={<Programs />} />
            <Route path="programs/:id" element={<ProgramDetail />} />

            {/* Corps member routes */}
            <Route path="applications" element={<ProtectedRoute roles={["corps_member"]}><Applications /></ProtectedRoute>} />
            <Route path="my-trainers" element={<ProtectedRoute roles={["corps_member"]}><MyTrainers /></ProtectedRoute>} />
            <Route path="find-trainers" element={<ProtectedRoute roles={["corps_member"]}><FindTrainers /></ProtectedRoute>} />
            <Route path="connect-trainer/:trainerId" element={<ProtectedRoute roles={["corps_member"]}><ConnectTrainer /></ProtectedRoute>} />
            <Route path="connection-success" element={<ProtectedRoute roles={["corps_member"]}><ConnectionSuccess /></ProtectedRoute>} />
            <Route path="trainee-fast-track" element={<ProtectedRoute roles={["corps_member"]}><TraineeFastTrack /></ProtectedRoute>} />

            {/* Trainer routes */}
            <Route path="course-management" element={<ProtectedRoute roles={["trainer"]}><CourseManagement /></ProtectedRoute>} />
            <Route path="my-corpers" element={<ProtectedRoute roles={["trainer"]}><MyCorpers /></ProtectedRoute>} />
            <Route path="fast-track-videos" element={<ProtectedRoute roles={["trainer"]}><FastTrackVideos /></ProtectedRoute>} />
            <Route path="corper-profile/:corperId" element={<ProtectedRoute roles={["trainer"]}><CorperProfile /></ProtectedRoute>} />

            {/* Admin routes inside app */}
            <Route path="manage-applications" element={<ProtectedRoute roles={["saed_admin", "dunis_admin", "trainer"]}><ManageApplications /></ProtectedRoute>} />
            <Route path="admin-courses" element={<ProtectedRoute roles={["saed_admin", "dunis_admin"]}><AdminCourses /></ProtectedRoute>} />
            <Route path="program-editor" element={<ProtectedRoute roles={["saed_admin", "dunis_admin"]}><ProgramEditor /></ProtectedRoute>} />
            <Route path="users" element={<ProtectedRoute roles={["saed_admin", "dunis_admin"]}><ManageUsers /></ProtectedRoute>} />
            <Route path="dunis-admin" element={<ProtectedRoute roles={["dunis_admin"]}><DunisAdmin /></ProtectedRoute>} />

            {/* Shared routes */}
            <Route path="courses/:courseId" element={<CourseDetail />} />
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
