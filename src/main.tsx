import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// URL に ?mockup を付けると、新しい体験のモックアップ（固定データ・ログイン不要）を開く
const Mockup = lazy(() => import('./mockup/Mockup.tsx'))
const showMockup = new URLSearchParams(window.location.search).has('mockup')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {showMockup ? (
      <Suspense fallback={null}>
        <Mockup />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
)
