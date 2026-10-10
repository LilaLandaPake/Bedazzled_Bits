import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { initAuth } from './lib/auth.js'
import { initTheme } from './lib/theme.js'

initTheme()

// Wait for the login session before the first render so pages know who is signed in.
initAuth().finally(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  )
})
