export interface User {
  id: string
  email: string
  name: string
  role: string
  avatar?: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

export interface ApiResponse<T> {
  data: T
  message: string
  success: boolean
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}
