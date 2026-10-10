import React from 'react'
import { createRoot } from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import './styles.css'
import './agentDock.css'
import './fieldKit.css'
import './streetSketch.css'
import './pocketPlan.css'
import App from './App.jsx'
// Keep the approved charcoal/mint palette last so it covers every feature module.
import './darkTheme.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
