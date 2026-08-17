import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Input } from '@/components/ui/Input'

const schema = z.object({
  name:     z.string().min(2, 'Name required'),
  email:    z.string().email('Invalid email'),
  password: z.string().min(6, 'Min 6 characters'),
  confirm:  z.string(),
}).refine((d) => d.password === d.confirm, {
  message: "Passwords don't match",
  path: ['confirm'],
})
type FormData = z.infer<typeof schema>

export function SignupPage() {
  const { signUp, loginWithGoogle } = useAuth()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async ({ name, email, password, confirm }: FormData) => {
    await signUp(name, email, password, confirm)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative"
         style={{ background: '#050d1a' }}>
      <div className="fixed inset-0 grid-bg pointer-events-none" />
      <div className="fixed pointer-events-none"
           style={{ width:500,height:500,bottom:-150,right:-150,borderRadius:'50%',background:'rgba(168,85,247,0.04)',filter:'blur(80px)' }} />

      <div className="w-full max-w-sm relative z-10 animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center font-extrabold text-xl text-white mx-auto mb-3"
               style={{ background: 'linear-gradient(135deg,#00d4aa,#a855f7)' }}>A</div>
          <div className="text-xl font-extrabold tracking-tight text-text-primary">Create account</div>
          <div className="text-sm text-text-secondary mt-1">Join the command center</div>
        </div>

        <div className="rounded-lg border border-border bg-card p-8"
             style={{ boxShadow: '0 0 60px rgba(0,212,170,0.06)' }}>

          <button onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-sm border border-border
                       bg-bg-secondary text-sm font-semibold text-text-primary hover:border-border-2 transition-all duration-200 mb-5">
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[11px] font-mono text-text-muted">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input label="Full Name" placeholder="John Dev"
                   error={errors.name?.message} {...register('name')} />
            <Input label="Email" type="email" placeholder="you@example.com"
                   error={errors.email?.message} {...register('email')} />
            <Input label="Password" type="password" placeholder="••••••••"
                   error={errors.password?.message} {...register('password')} />
            <Input label="Confirm Password" type="password" placeholder="••••••••"
                   error={errors.confirm?.message} {...register('confirm')} />
            <button type="submit" disabled={isSubmitting}
                    className="btn-primary justify-center mt-1 disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? <><span className="spinner" style={{width:14,height:14}} /> Creating…</> : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-xs text-text-secondary mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-teal hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}
