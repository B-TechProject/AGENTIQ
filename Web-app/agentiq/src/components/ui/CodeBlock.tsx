import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface CodeBlockProps {
  code: string
  language?: string
  maxHeight?: string
}

export function CodeBlock({ code, maxHeight = '200px' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="relative rounded border border-border bg-bg-primary overflow-hidden">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded text-xs font-mono
                   bg-card border border-border text-text-muted hover:text-teal hover:border-teal transition-all duration-150"
      >
        {copied ? <Check size={10} /> : <Copy size={10} />}
        {copied ? 'Copied!' : 'Copy'}
      </button>
      <pre
        className="p-4 font-mono text-xs text-teal overflow-auto"
        style={{ maxHeight }}
      >
        {code}
      </pre>
    </div>
  )
}
