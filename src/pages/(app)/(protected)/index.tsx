/**
 * Root route. This page sits behind the sign-in gate, so anyone who opens
 * the app link while signed out gets the sign in panel first. Signed in
 * users continue straight to the room home page.
 */

import { Navigate } from 'react-router-dom'

export default function RootPage() {
  return <Navigate to="/home" replace />
}
