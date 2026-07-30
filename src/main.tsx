import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Suppress cross-origin window property inspection errors in iframe preview
window.addEventListener(
  'error',
  (event) => {
    const msg = event.message || String(event.error || '');
    if (
      msg.includes('SecurityError') ||
      msg.includes('$$typeof') ||
      msg.includes('Blocked a frame with origin') ||
      msg.includes('cross-origin frame')
    ) {
      event.preventDefault();
      event.stopPropagation();
      return true;
    }
  },
  true
);

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason?.message || String(event.reason || '');
  if (
    reason.includes('SecurityError') ||
    reason.includes('$$typeof') ||
    reason.includes('Blocked a frame with origin') ||
    reason.includes('cross-origin frame')
  ) {
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);


