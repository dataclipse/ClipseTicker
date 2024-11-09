//src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './css/index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/auth_context';

// Main entry point for the application.
// - Wraps the App component with necessary providers and routing setup.
// - Enables Strict Mode for highlighting potential issues in development.

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>

    {/* BrowserRouter enables routing for the application */}
    <BrowserRouter>

      {/* AuthProvider provides authentication context to the app */}
      <AuthProvider>

        {/* Main App component containing the application structure */}
        <App />

      </AuthProvider>

    </BrowserRouter>
    
  </React.StrictMode>
);