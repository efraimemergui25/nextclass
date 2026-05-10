import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

if (typeof window !== 'undefined') {
  window.onerror = function(msg, url, line, col, error) {
    const div = document.createElement('div');
    div.style.cssText = 'position:fixed;top:0;left:0;width:100%;z-index:9999;background:#FF3B30;color:white;padding:20px;font-family:monospace;font-size:14px;white-space:pre-wrap;';
    div.innerText = 'Runtime Error: ' + msg + '\nAt: ' + url + ':' + line + ':' + col + '\nStack: ' + (error ? error.stack : 'N/A');
    document.body.appendChild(div);
  };
  window.onunhandledrejection = function(event) {
    const div = document.createElement('div');
    div.style.cssText = 'position:fixed;bottom:0;left:0;width:100%;z-index:9999;background:#5856D6;color:white;padding:20px;font-family:monospace;font-size:14px;';
    div.innerText = 'Promise Rejection: ' + event.reason;
    document.body.appendChild(div);
  };
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
