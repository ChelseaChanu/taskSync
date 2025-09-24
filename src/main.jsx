import React from 'react';
import { HashRouter as Router } from "react-router-dom";
import { SelectedUserProvider } from './components/SelectedUserContext.jsx';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
       <SelectedUserProvider>
        <App />
      </SelectedUserProvider>
    </Router>
  </StrictMode>
)