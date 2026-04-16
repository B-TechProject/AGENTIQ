import { useNavigate } from 'react-router-dom'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 relative"
         style={{ background: '#050d1a' }}>
      <div className="fixed inset-0 grid-bg pointer-events-none" />
      <div className="fixed pointer-events-none"
           style={{ width: 400, height: 400, top: -100, left: -100, borderRadius: '50%', background: 'rgba(0,212,170,0.05)', filter: 'blur(80px)' }} />

      <div className="relative z-10 animate-fade-in">
        {/* Glitchy 404 */}
        <div
          className="text-8xl font-extrabold tracking-tighter mb-4 select-none"
          style={{
            background: 'linear-gradient(135deg, #00d4aa, #a855f7)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 40px rgba(0,212,170,0.3))',
          }}
        >
          404
        </div>

        <div className="text-xl font-bold mb-2 text-text-primary">Page Not Found</div>
        <div className="text-sm text-text-secondary mb-8 max-w-xs">
          The agent couldn't locate this route. It may have been moved or deleted.
        </div>

        <div className="flex items-center gap-3 justify-center">
          <button className="btn-primary" onClick={() => navigate('/')}>
            ← Back to Command Center
          </button>
          <button className="btn-ghost" onClick={() => navigate(-1)}>
            Go Back
          </button>
        </div>

        {/* Terminal-style error */}
        <div className="mt-10 max-w-sm mx-auto text-left rounded border border-border bg-card p-4 font-mono text-xs text-text-muted">
          <div><span className="text-red">ERROR</span> AgentIQ Router v1.0</div>
          <div className="mt-1"><span className="text-text-muted">→</span> Route <span className="text-teal">{window.location.pathname}</span> not found</div>
          <div><span className="text-text-muted">→</span> Status: <span className="text-orange">404 NOT_FOUND</span></div>
          <div><span className="text-text-muted">→</span> Suggestion: Navigate to <span className="text-green">/dashboard</span></div>
        </div>
      </div>
    </div>
  )
}
