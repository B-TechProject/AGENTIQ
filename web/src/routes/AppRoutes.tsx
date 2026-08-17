import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout }      from '@/components/layout/AppLayout'
import { useAuthStore }   from '@/store/authStore'

import { LandingPage }    from '@/pages/LandingPage'
import { DashboardPage }  from '@/pages/DashboardPage'
import { TestRunnerPage } from '@/pages/TestRunnerPage'
import { SecurityPage }   from '@/pages/SecurityPage'
import { HistoryPage }    from '@/pages/HistoryPage'
import { DeployPage }     from '@/pages/DeployPage'
import { SettingsPage }   from '@/pages/SettingsPage'
import { LoginPage }      from '@/pages/LoginPage'
import { SignupPage }     from '@/pages/SignupPage'
import { NotFoundPage }   from '@/pages/NotFoundPage'
import { GoogleSuccessPage } from '@/pages/GoogleSuccessPage'
import { ApiClientPage }    from '@/pages/ApiClientPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuthStore()

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuthStore()

  if (token && user) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Guest-only */}
      <Route path="/login"  element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/signup" element={<GuestRoute><SignupPage /></GuestRoute>} />
      <Route path="/google-success" element={<GoogleSuccessPage />} />

      {/* Protected app shell */}
      <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
        <Route path="/"          element={<LandingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/test"      element={<TestRunnerPage />} />
        <Route path="/api-client" element={<ApiClientPage />} />
        <Route path="/security"  element={<SecurityPage />} />
        <Route path="/history"   element={<HistoryPage />} />
        <Route path="/deploy"    element={<DeployPage />} />
        <Route path="/settings"  element={<SettingsPage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
