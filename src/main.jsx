/**
 * main.jsx
 * ------------------------------
 * Entry point of the React application.
 *
 * This file mounts the root React component (`App`) into the DOM.
 *
 * Responsibilities:
 * 1. Import global styles (`index.css`) — CSS Modules will be used for component-specific styles.
 * 2. Render the App component inside the root <div> in index.html.
 * 3. Wrap App in React.StrictMode for highlighting potential issues during development.
 *
 * Notes:
 * - The App component will manage global application state such as:
 *   - Current loaded PDF document.
 *   - Highlights, annotations, and TTS (text-to-speech) state.
 *   - IndexedDB integration for saving/loading documents.
 * - Additional components (PDF viewer, toolbar, highlight layer, annotations layer, voice controls, etc.)
 *   will be imported and used inside `App.jsx`.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AppProvider } from './context/AppContext.jsx';
import { DbProvider } from './context/DbContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProvider>
      <DbProvider>
        <App />
      </DbProvider>
    </AppProvider>
  </React.StrictMode>
);
