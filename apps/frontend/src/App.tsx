import React from 'react'
import { AuthProvider } from './components/AuthProvider'
import { useAuth } from './hooks/useAuth'
import LoginPage from './components/LoginPage'
import { Dashboard } from './components/Dashboard'
import AuthCallback from './components/AuthCallback'
import './index.css'

const AppContent: React.FC = () => {
  const { user, logout, isLoading } = useAuth()
  const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost'
  
  // Handle OAuth callback
  if (window.location.pathname === '/auth/callback') {
    return <AuthCallback />
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // In development mode, allow access without authentication
  if (!user && !isDevelopment) {
    return <LoginPage />
  }

  return <Dashboard onLogout={logout} />
}

const App: React.FC = () => {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <AppContent />
      </div>
    </AuthProvider>
  )
}

export default App
