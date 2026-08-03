import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import DashboardShell from '../components/layout/DashboardShell';

import CandidateLoginPage from '../features/auth/pages/CandidateLoginPage';
import CandidateRegisterPage from '../features/auth/pages/CandidateRegisterPage';
import VerifyOtpPage from '../features/auth/pages/VerifyOtpPage';
import ForgotPasswordPage from '../features/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from '../features/auth/pages/ResetPasswordPage';

import CandidateDashboardPage from '../features/dashboard/pages/CandidateDashboardPage';
import ProfileSettingsPage from '../features/profile/pages/ProfileSettingsPage';

import ReadinessInputPage from '../features/readiness/pages/ReadinessInputPage';
import ReadinessHistoryPage from '../features/readiness/pages/ReadinessHistoryPage';
import ReadinessReportPage from '../features/readiness/pages/ReadinessReportPage';

import ConstituencySearchPage from '../features/constituency/pages/ConstituencySearchPage';

import PlanGeneratorPage from '../features/campaign-planner/pages/PlanGeneratorPage';
import PlanListPage from '../features/campaign-planner/pages/PlanListPage';
import PlanDetailPage from '../features/campaign-planner/pages/PlanDetailPage';

import AiToolsHubPage from '../features/ai-tools/pages/AiToolsHubPage';
import SpeechGeneratorPage from '../features/ai-tools/pages/SpeechGeneratorPage';
import ManifestoBuilderPage from '../features/ai-tools/pages/ManifestoBuilderPage';
import OppositionTrackerPage from '../features/ai-tools/pages/OppositionTrackerPage';
import SocialMediaGeneratorPage from '../features/ai-tools/pages/SocialMediaGeneratorPage';

import VolunteerListPage from '../features/volunteers/pages/VolunteerListPage';
import VolunteerInvitePage from '../features/volunteers/pages/VolunteerInvitePage';
import VolunteerSignupPage from '../features/volunteers/pages/VolunteerSignupPage';
import TaskBoardPage from '../features/volunteers/pages/TaskBoardPage';
import BoothMapPage from '../features/volunteers/pages/BoothMapPage';
import VolunteerFieldActionsPage from '../features/volunteers/pages/VolunteerFieldActionsPage';

import LiveCommandCenterPage from '../features/command-center/pages/LiveCommandCenterPage';

import AdminShell from '../features/admin/components/AdminShell';
import AdminDashboardPage from '../features/admin/pages/AdminDashboardPage';
import UserManagementPage from '../features/admin/pages/UserManagementPage';
import CampaignMonitoringPage from '../features/admin/pages/CampaignMonitoringPage';
import LeadManagementPage from '../features/admin/pages/LeadManagementPage';
import AiUsageMonitoringPage from '../features/admin/pages/AiUsageMonitoringPage';
import AuditLogPage from '../features/admin/pages/AuditLogPage';

import LandingPage from '../features/public/pages/LandingPage';
import ContactPage from '../features/public/pages/ContactPage';
import CandidatePublicProfilePage from '../features/public/pages/CandidatePublicProfilePage';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* --- Public (no auth) --- */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/candidate/:slug" element={<CandidatePublicProfilePage />} />
        <Route path="/volunteer-signup" element={<VolunteerSignupPage />} />

        {/* --- Auth --- */}
        <Route path="/login" element={<CandidateLoginPage />} />
        <Route path="/register" element={<CandidateRegisterPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* --- Authenticated shell (Part 1) --- */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardShell />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<CandidateDashboardPage />} />
          <Route path="/profile" element={<ProfileSettingsPage />} />

          {/* --- Part 2 --- */}
          <Route path="/readiness" element={<ReadinessInputPage />} />
          <Route path="/readiness/history" element={<ReadinessHistoryPage />} />
          <Route path="/readiness/reports/:id" element={<ReadinessReportPage />} />

          <Route path="/constituency" element={<ConstituencySearchPage />} />

          <Route path="/campaign-planner" element={<PlanListPage />} />
          <Route path="/campaign-planner/new" element={<PlanGeneratorPage />} />
          <Route path="/campaign-planner/:id" element={<PlanDetailPage />} />

          <Route path="/ai-tools" element={<AiToolsHubPage />} />
          <Route path="/ai-tools/speech" element={<SpeechGeneratorPage />} />
          <Route path="/ai-tools/manifesto" element={<ManifestoBuilderPage />} />
          <Route path="/ai-tools/opposition" element={<OppositionTrackerPage />} />
          <Route path="/ai-tools/social" element={<SocialMediaGeneratorPage />} />

          {/* --- Part 3 --- */}
          <Route path="/command-center" element={<LiveCommandCenterPage />} />

          <Route path="/volunteers" element={<VolunteerListPage />} />
          <Route path="/volunteers/invite" element={<VolunteerInvitePage />} />
          <Route path="/tasks" element={<TaskBoardPage />} />
          <Route path="/booths" element={<BoothMapPage />} />
          <Route path="/field-actions" element={<VolunteerFieldActionsPage />} />
        </Route>

        {/* --- Admin shell (Part 3), separate layout, role-gated --- */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <AdminShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="campaigns" element={<CampaignMonitoringPage />} />
          <Route path="leads" element={<LeadManagementPage />} />
          <Route path="ai-usage" element={<AiUsageMonitoringPage />} />
          <Route path="audit-log" element={<AuditLogPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
