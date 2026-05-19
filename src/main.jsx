import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { SpeedInsights } from '@vercel/speed-insights/react'
import './index.css'
import App from './App.jsx'

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).then(reg => {
            // Force new SW to activate immediately without waiting for tab close
            reg.addEventListener('updatefound', () => {
                const newWorker = reg.installing;
                if (!newWorker) return;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        newWorker.postMessage({ type: 'SKIP_WAITING' });
                    }
                });
            });
        }).catch(() => {});

        // When a new SW takes control, reload to get fresh assets
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload();
        });
    });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <SpeedInsights />
  </StrictMode>,
)
