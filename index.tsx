
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// Ensure process.env is defined globally to handle platform-injected API keys
// without throwing ReferenceErrors in the browser.
(window as any).process = (window as any).process || {};
(window as any).process.env = (window as any).process.env || {};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
