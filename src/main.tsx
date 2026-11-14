import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { MotionConfig } from 'motion/react'
import { I18nProvider } from './lib/i18n'
import './index.css'
import Landing from './pages/Landing'

const Auth = lazy(() => import('./pages/Auth'))
const Onboarding = lazy(() => import('./pages/Onboarding'))
const Workspace = lazy(() => import('./pages/Workspace'))
const Showcase = lazy(() => import('./pages/Showcase'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <MotionConfig reducedMotion="user">
        <BrowserRouter>
          <Suspense fallback={<div className="min-h-screen bg-bg" />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Auth mode="login" />} />
              <Route path="/signup" element={<Auth mode="signup" />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/app/*" element={<Workspace />} />
              <Route path="/demo" element={<Showcase />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </MotionConfig>
    </I18nProvider>
  </StrictMode>,
)
