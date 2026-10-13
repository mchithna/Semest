import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { AuthProvider } from './context/AuthContext'
import { Toaster } from 'sonner'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ThemeProvider, useTheme } from './components/theme-provider'
import './index.css'

import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import OnboardingPage from './pages/OnboardingPage'
import DashboardPage from './pages/DashboardPage'
import DegreesPage from './pages/DegreesPage'
import SemestersPage from './pages/SemestersPage'
import NewSemesterPage from './pages/NewSemesterPage'
import EditSemesterPage from './pages/EditSemesterPage'
import ScalesPage from './pages/settings/ScalesPage'
import PresetsPage from './pages/PresetsPage'
import NewPresetPage from './pages/NewPresetPage'
import MyPresetsPage from './pages/MyPresetsPage'
import PresetDetailPage from './pages/PresetDetailPage'
import { AppShell } from './components/layout/AppShell'

function AppToaster() {
  const { theme } = useTheme()
  return <Toaster position="top-right" richColors theme={theme} />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="semest-theme">
        <AuthProvider>
          <AppToaster />
          <BrowserRouter>
            <AppShell>
            <Routes>
              <Route path="/" element={<><title>Semest</title><LandingPage /></>} />
              <Route path="/auth" element={<AuthPage />} />
              
              {/* Protected Routes */}
              <Route path="/onboarding" element={<ProtectedRoute allowIncomplete><><title>Set up · Semest</title><OnboardingPage /></></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><><title>Dashboard · Semest</title><DashboardPage /></></ProtectedRoute>} />
              <Route path="/degrees" element={<ProtectedRoute><><title>Degrees · Semest</title><DegreesPage /></></ProtectedRoute>} />
              <Route path="/degrees/:degreeId/semesters" element={<ProtectedRoute><SemestersPage /></ProtectedRoute>} />
              <Route path="/degrees/:degreeId/semesters/new" element={<ProtectedRoute><><title>New semester · Semest</title><NewSemesterPage /></></ProtectedRoute>} />
              <Route path="/degrees/:degreeId/semesters/:id/edit" element={<ProtectedRoute><><title>Edit semester · Semest</title><EditSemesterPage /></></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><><title>Settings · Semest</title><ScalesPage /></></ProtectedRoute>} />
              <Route path="/settings/scales" element={<ProtectedRoute><><title>Settings · Semest</title><ScalesPage /></></ProtectedRoute>} />
              <Route path="/presets/new" element={<ProtectedRoute><><title>New preset · Semest</title><NewPresetPage /></></ProtectedRoute>} />
              <Route path="/presets/mine" element={<ProtectedRoute><><title>My presets · Semest</title><MyPresetsPage /></></ProtectedRoute>} />
              
              {/* Public Preset Routes */}
              <Route path="/presets" element={<><title>Presets · Semest</title><PresetsPage /></>} />
              <Route path="/presets/:code" element={<PresetDetailPage />} />
            </Routes>
          </AppShell>
        </BrowserRouter>
      </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
)

