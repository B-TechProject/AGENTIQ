interface LoaderProps {
  message?: string
  className?: string
}

export function Loader({ message = 'Loading...', className }: LoaderProps) {
  return (
    <div className={`flex items-center justify-center gap-2 py-10 text-text-muted font-mono text-sm ${className ?? ''}`}>
      <div className="spinner" />
      {message}
    </div>
  )
}

export function InlineLoader({ message }: { message?: string }) {
  return (
    <div className="flex items-center gap-2 text-text-muted font-mono text-xs">
      <div className="spinner" style={{ width: 12, height: 12 }} />
      {message}
    </div>
  )
}
