import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { SpeedInsights } from '@vercel/speed-insights/react'
import './index.css'
import App from './App.jsx'

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch(() => {});
    });
}

// ── Stale-deployment recovery ────────────────────────────────────────────────
// After a new deploy the server purges old hashed chunks. A browser that still holds
// the previous index tries to lazy-load a chunk hash that no longer exists → 404. Vite
// fires `vite:preloadError`; we reload ONCE (guarded, so we never loop) to pull the fresh
// index + valid hashes. The guard clears after a healthy load so a future deploy can heal too.
window.addEventListener('vite:preloadError', (e) => {
    e.preventDefault();
    if (!sessionStorage.getItem('nc_chunk_reloaded')) {
        sessionStorage.setItem('nc_chunk_reloaded', '1');
        window.location.reload();
    }
});
window.addEventListener('load', () => setTimeout(() => { try { sessionStorage.removeItem('nc_chunk_reloaded'); } catch {} }, 5000));

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <SpeedInsights />
  </StrictMode>,
)
