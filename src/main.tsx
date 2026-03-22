import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/features/auth/AuthProvider';
import './styles/index.css';
import App from './App.tsx';

// Debug: show errors on page without destroying React
const debugEl = document.createElement('div');
debugEl.id = 'debug-overlay';
debugEl.style.cssText = 'position:fixed;bottom:0;left:0;right:0;max-height:30vh;overflow:auto;background:#111;color:#0f0;font:12px monospace;padding:8px;z-index:99999;display:none';
document.body.appendChild(debugEl);

function debugLog(msg: string) {
  debugEl.style.display = 'block';
  debugEl.innerHTML += msg + '<br>';
}

window.addEventListener('error', (e) => {
  debugLog(`ERROR: ${e.message} @ ${e.filename}:${e.lineno}`);
});
window.addEventListener('unhandledrejection', (e) => {
  debugLog(`REJECTION: ${e.reason?.message ?? e.reason}`);
});

debugLog(`[${new Date().toLocaleTimeString()}] JS loaded, mounting React...`);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      refetchOnWindowFocus: true,
    },
  },
});

try {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>
    </StrictMode>,
  );
  debugLog(`[${new Date().toLocaleTimeString()}] React mounted OK`);
} catch (err) {
  debugLog(`MOUNT CRASH: ${err}`);
}
