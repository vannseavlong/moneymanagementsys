import React, { useState, useEffect } from 'react'
import { AuthContext, type AuthContextType, type User } from '@/contexts/AuthContext'

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for authentication callback from URL parameters
    const urlParams = new URLSearchParams(window.location.search)
    const authStatus = urlParams.get('auth')
    const userParam = urlParams.get('user')
    const tokensParam = urlParams.get('tokens')
    
    if (authStatus === 'success' && userParam && tokensParam) {
      try {
        const userData = JSON.parse(decodeURIComponent(userParam))
        const tokens = JSON.parse(decodeURIComponent(tokensParam))
        
        setUser(userData)
        setAccessToken(tokens.access_token)
        
        // Store in localStorage
        localStorage.setItem('user', JSON.stringify(userData))
        localStorage.setItem('accessToken', tokens.access_token)
        
        if (tokens.refresh_token) {
          localStorage.setItem('refreshToken', tokens.refresh_token)
        }
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname)
      } catch (error) {
        console.error('Error parsing authentication callback:', error)
      }
      setIsLoading(false)
      return
    }
    
    if (authStatus === 'error') {
      const errorMessage = urlParams.get('message') || 'Authentication failed'
      console.error('Authentication error:', errorMessage)
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
      setIsLoading(false)
      return
    }

    // Check for stored auth data on mount
    const storedUser = localStorage.getItem('user')
    const storedToken = localStorage.getItem('accessToken')
    
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser))
      setAccessToken(storedToken)
    }
    
    setIsLoading(false)
  }, [])

  const login = async (code: string) => {
    try {
      setIsLoading(true)
      const response = await fetch('http://localhost:3001/api/auth/google/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      })

      if (!response.ok) {
        throw new Error('Authentication failed')
      }

      const { tokens, user: userData } = await response.json()
      
      setUser(userData)
      setAccessToken(tokens.access_token)
      
      // Store in localStorage
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('accessToken', tokens.access_token)
      
      if (tokens.refresh_token) {
        localStorage.setItem('refreshToken', tokens.refresh_token)
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    setAccessToken(null)
    localStorage.removeItem('user')
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('spreadsheetId')
  }

  const value: AuthContextType = {
    user,
    accessToken,
    login,
    logout,
    isLoading,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}