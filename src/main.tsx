import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ResponsiveProvider } from './utils/ResponsiveContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <ResponsiveProvider>
    <App />
  </ResponsiveProvider>
);

