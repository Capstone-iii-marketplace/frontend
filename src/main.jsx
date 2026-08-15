// App entry point — Vite loads this file first (see index.html).
// It finds the #root div in the HTML and mounts the whole React app into it.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// StrictMode double-invokes some functions in dev only, to help catch bugs.
// It has no effect on the production build.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
