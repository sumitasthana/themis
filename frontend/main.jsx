import React from 'react';
import ReactDOM from 'react-dom/client';
import ThemisPlatform from './themis-platform.jsx';

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <ThemisPlatform />
    </React.StrictMode>
  );
}
