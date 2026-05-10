import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

if (typeof window !== 'undefined') {
  const showError = (type, err) => {
    const div = document.createElement('div');
    div.id = 'debug-error-overlay';
    div.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:999999;background:rgba(255,0,0,0.95);color:white;padding:40px;font-family:sans-serif;overflow:auto;line-height:1.5;';
    div.innerHTML = `
      <h1 style="font-size:32px;margin-bottom:20px;font-weight:900;">🚨 CRITICAL ERROR DETECTED</h1>
      <p style="font-size:18px;background:rgba(0,0,0,0.3);padding:15px;border-radius:10px;"><b>Type:</b> ${type}</p>
      <pre style="margin-top:20px;background:white;color:black;padding:20px;border-radius:10px;font-size:14px;white-space:pre-wrap;">${err}</pre>
      <button onclick="window.location.reload()" style="margin-top:20px;padding:15px 30px;background:white;color:red;border:none;border-radius:10px;font-weight:bold;cursor:pointer;">RELOAD SITE</button>
    `;
    if (document.body) {
      document.body.appendChild(div);
    } else {
      window.addEventListener('DOMContentLoaded', () => document.body.appendChild(div));
    }
  };

  window.onerror = (msg, url, line, col, error) => {
    showError('Runtime Crash', `${msg}\nAt: ${url}:${line}:${col}\nStack: ${error?.stack || 'N/A'}`);
  };
  window.onunhandledrejection = (event) => {
    showError('Promise Rejection (Async)', event.reason);
  };
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
