import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Self-hosted variable fonts (STYLE.md §3)
import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
// @ts-ignore
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
