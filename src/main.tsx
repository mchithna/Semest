import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/degrees" element={<DegreesPage />} />
        <Route path="/degrees/:degreeId/semesters" element={<SemestersPage />} />
        <Route path="/degrees/:degreeId/semesters/new" element={<NewSemesterPage />} />
        <Route path="/degrees/:degreeId/semesters/:id/edit" element={<EditSemesterPage />} />
        <Route path="/settings/scales" element={<ScalesPage />} />
        <Route path="/presets" element={<PresetsPage />} />
        <Route path="/presets/new" element={<NewPresetPage />} />
        <Route path="/presets/mine" element={<MyPresetsPage />} />
        <Route path="/presets/:code" element={<PresetDetailPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
