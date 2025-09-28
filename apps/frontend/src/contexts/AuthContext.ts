import { createContext } from 'react'

export interface User {
  id: string
  email: string
  name: string
  picture?: string
}

export interface AuthContextType {
  user: User | null
  accessToken: string | null
  login: (code: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)