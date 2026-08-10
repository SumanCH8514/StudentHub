import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// Silence 3rd-party extension & browser warning noise in dev console
if (typeof window !== 'undefined') {
  const filterNoise = (msg) => {
    if (!msg) return false;
    const str = String(msg);
    return (
      str.includes('content.js') ||
      str.includes('polyfill.js') ||
      str.includes('Could not establish connection') ||
      str.includes('Receiving end does not exist') ||
      str.includes('beforeinstallpromptevent') ||
      str.includes('useCache')
    );
  };

  window.addEventListener('unhandledrejection', (event) => {
    if (filterNoise(event.reason) || filterNoise(event.reason?.stack) || filterNoise(event.reason?.message)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });

  window.addEventListener('error', (event) => {
    if (filterNoise(event.message) || filterNoise(event.filename)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });

  const origError = console.error;
  console.error = (...args) => {
    if (args.some(arg => filterNoise(arg) || filterNoise(arg?.message) || filterNoise(arg?.stack))) return;
    origError.apply(console, args);
  };

  const origWarn = console.warn;
  console.warn = (...args) => {
    if (args.some(arg => filterNoise(arg) || filterNoise(arg?.message) || filterNoise(arg?.stack))) return;
    origWarn.apply(console, args);
  };
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <App />
    </BrowserRouter>
  </StrictMode>
)
