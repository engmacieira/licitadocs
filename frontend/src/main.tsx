import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Removemos o import './App.css' se ele não tiver utilidade, 
// ou mantemos vazio apenas para não quebrar o build se o arquivo existir.
import './App.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);