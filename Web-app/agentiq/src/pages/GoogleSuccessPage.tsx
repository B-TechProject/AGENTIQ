import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export function GoogleSuccessPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const auth = useAuthStore()

  useEffect(() => {
    const token = params.get('token')
    const name = params.get('name')

    if (!token) {
      navigate('/login')
      return
    }

    const user = {
      id: 'google-user',
      name: name || 'Google User',
      email: 'google-user@gmail.com',
      plan: 'free' as const, // ✅ FIX HERE
    }

    auth.login(user, token)
    navigate('/')
  }, [])

  return <div>Signing you in with Google...</div>
}