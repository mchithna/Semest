import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { AuthProvider } from './context/AuthContext'
import { Toaster } from 'sonner'
import { ProtectedRoute } from './components/ProtectedRoute'
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster position="top-right" richColors theme="dark" />
        <BrowserRouter>
          <AppShell>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />
              
              {/* Protected Routes */}
              <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/degrees" element={<ProtectedRoute><DegreesPage /></ProtectedRoute>} />
              <Route path="/degrees/:degreeId/semesters" element={<ProtectedRoute><SemestersPage /></ProtectedRoute>} />
              <Route path="/degrees/:degreeId/semesters/new" element={<ProtectedRoute><NewSemesterPage /></ProtectedRoute>} />
              <Route path="/degrees/:degreeId/semesters/:id/edit" element={<ProtectedRoute><EditSemesterPage /></ProtectedRoute>} />
              <Route path="/settings/scales" element={<ProtectedRoute><ScalesPage /></ProtectedRoute>} />
              <Route path="/presets/new" element={<ProtectedRoute><NewPresetPage /></ProtectedRoute>} />
              <Route path="/presets/mine" element={<ProtectedRoute><MyPresetsPage /></ProtectedRoute>} />
              
              {/* Public Preset Routes */}
              <Route path="/presets" element={<PresetsPage />} />
              <Route path="/presets/:code" element={<PresetDetailPage />} />
            </Routes>
          </AppShell>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)

