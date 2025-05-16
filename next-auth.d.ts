import { User, DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    accessToken?: string
    refreshToken?: string
    expiresAt?: number
  }

  interface User {
    accessToken?: string
    refreshToken?: string
    expiresAt?: number
  }
}
