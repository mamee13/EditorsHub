const API_URL = process.env.NEXT_PUBLIC_API_URL

export interface RegisterData {
  email: string
  password: string
  passwordConfirm: string
  role: 'client' | 'editor'
  profile: {
    name: string
    bio: string
    avatar: string
    portfolio: string
    type?: 'photo' | 'video' | 'both'
  }
}

interface VerifyEmailData {
  email: string;
  code: string;
}

export const authService = {
  async register(data: RegisterData) {
    try {
      const response = await fetch(`${API_URL}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const responseData = await response.json()

      if (!response.ok) {
        return { error: responseData.message || 'Registration failed' }
      }

      return { data: responseData }
    } catch (error) {
      return { error: 'An error occurred during registration' }
    }
  },  // Added comma here

  verifyEmailToken: async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/users//verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.message || 'Verification failed' }
      }

      return { data }
    } catch (error) {
      return { error: 'An error occurred during verification' }
    }
  },

  verifyEmail: async (data: VerifyEmailData) => {
    try {
      const response = await fetch(`${API_URL}/users/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const responseData = await response.json()

      if (!response.ok) {
        return { error: responseData.message || 'Verification failed' }
      }

      return { data: responseData }
    } catch (error) {
      return { error: 'An error occurred during verification' }
    }
  }
}