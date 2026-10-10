import { Navigate, useLocation } from 'react-router-dom'
import { getCurrentUser } from '../lib/session.js'

// Sends visitors without a session to the welcome screen.
export default function RequireUser({ children }) {
  const location = useLocation()
  if (!getCurrentUser()) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />
  }
  return children
}
