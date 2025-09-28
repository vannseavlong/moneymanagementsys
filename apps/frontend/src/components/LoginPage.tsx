import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'

const LoginPage: React.FC = () => {
  const { isLoading } = useAuth()

  const handleGoogleLogin = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/auth/google/url')
      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      console.error('Login error:', error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Welcome to MMMS
          </CardTitle>
          <CardDescription className="text-gray-600">
            Monthly Money Management System
          </CardDescription>
          <div className="flex justify-center mt-4">
            <img 
              src="/MMMS-Logo.png" 
              alt="MMMS Logo" 
              className="w-16 h-16"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 text-center">
            Manage your budget with multi-currency support (USD & KHR). 
            Your data is stored securely in your own Google Sheets.
          </p>
          
          <Button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            {isLoading ? 'Loading...' : 'Sign in with Google'}
          </Button>
          
          <div className="text-xs text-gray-500 text-center mt-4">
            <p>🔒 Privacy-first approach</p>
            <p>📊 Your data stays in your Google account</p>
            <p>💱 Multi-currency support (USD, KHR)</p>
            <p>📱 Mobile-responsive design</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default LoginPage