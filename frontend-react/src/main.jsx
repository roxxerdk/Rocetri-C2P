import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/styles.css';
import './styles/project.css';
import './styles/extraction.css';
import './styles/planning.css';
import './styles/report.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
