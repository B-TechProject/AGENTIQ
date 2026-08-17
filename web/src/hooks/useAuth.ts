import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'
import { apiService } from '@/services/api'
import { initials } from '@/utils'

export function useAuth() {
  const auth = useAuthStore()
  const toast = useToastStore()
  const navigate = useNavigate()

  // ── LOGIN ─────────────────────────────────────────
  const loginWithCredentials = async (email: string, password: string) => {
    try {
      const data = await apiService.login(email, password)

      auth.login(data.user, data.token)
      toast.show('Welcome back!', 'success', '👋')
      navigate('/')
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Login failed'

      toast.show(message, 'error', '❌')
    }
  }

  // ── GOOGLE LOGIN ──────────────────────────────────
  const loginWithGoogle = () => {
    window.location.href = 'http://localhost:3001/auth/google'
  }

  // ── SIGNUP ───────────────────────────────────────
  const signUp = async (
    name: string,
    email: string,
    password: string,
    confirmPassword: string
  ) => {
    try {
      const data = await apiService.signup(
        name,
        email,
        password,
        confirmPassword
      )

      auth.login(data.user, data.token)
      toast.show('Account created! Welcome 🎉', 'success', '🚀')
      navigate('/')
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Signup failed'

      toast.show(message, 'error', '❌')
    }
  }

  // ── LOGOUT ───────────────────────────────────────
  const logout = () => {
    auth.logout()
    localStorage.removeItem('agentiq-auth')
    toast.show('Signed out', 'info', '👋')
    navigate('/login')
  }

  // ── RETURN ───────────────────────────────────────
  return {
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    userInitials: auth.user ? initials(auth.user.name) : 'JD',
    loginWithCredentials,
    loginWithGoogle,
    signUp,
    logout,
  }
}