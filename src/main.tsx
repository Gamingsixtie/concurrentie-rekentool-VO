import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/features/auth/AuthProvider';
import './styles/index.css';
import App from './App.tsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      refetchOnWindowFocus: true,
    },
  },
});

// Surface any uncaught errors visibly during development
window.addEventListener('error', (e) => {
  document.getElementById('root')!.innerHTML =
    `<pre style="color:red;padding:20px;white-space:pre-wrap">UNCAUGHT ERROR:\n${e.message}\n\n${e.filename}:${e.lineno}</pre>`;
});

window.addEventListener('unhandledrejection', (e) => {
  document.getElementById('root')!.innerHTML =
    `<pre style="color:red;padding:20px;white-space:pre-wrap">UNHANDLED PROMISE:\n${e.reason}</pre>`;
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
