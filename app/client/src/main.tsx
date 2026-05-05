import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.scss';
import { AppProvider } from './contexts/AppContext';
import { App } from './App.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
);
