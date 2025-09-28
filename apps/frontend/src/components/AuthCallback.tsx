import React, { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'

const AuthCallback: React.FC = () => {
  const { login } = useAuth()

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')
      const error = urlParams.get('error')

      if (error) {
        console.error('Authentication error:', error)
        alert('Authentication failed. Please try again.')
        window.location.href = '/'
        return
      }

      if (code) {
        try {
          await login(code)
          window.location.href = '/'
        } catch (error) {
          console.error('Login failed:', error)
          alert('Login failed. Please try again.')
          window.location.href = '/'
        }
      }
    }

    handleCallback()
  }, [login])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-lg text-gray-600">Authenticating...</p>
      </div>
    </div>
  )
}

export default AuthCallback