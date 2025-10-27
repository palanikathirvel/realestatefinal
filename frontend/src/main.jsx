import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId='179687486579-eu51bqeabipe2m6osiu0ducfr5lp41dh.apps.googleusercontent.com'>

      <App />
    </GoogleOAuthProvider>

  </StrictMode>,
)
