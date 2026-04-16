import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { CodeBlock } from '@/components/ui/CodeBlock'
import { CustomResponseData } from '@/services/api'

interface ResponseViewerProps {
  response: CustomResponseData | null
  loading?: boolean
  emptyMessage?: string
}

export function ResponseViewer({ response, loading, emptyMessage = 'Submit to get a response' }: ResponseViewerProps) {
  const [resTab, setResTab] = useState<'body' | 'headers'>('body')

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green'
    if (status >= 300 && status < 400) return 'text-teal'
    if (status >= 400 && status < 500) return 'text-orange'
    return 'text-red'
  }

  return (
    <Card className="p-4 flex flex-col h-full min-h-[300px]">
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-text-muted gap-4">
          <div className="w-8 h-8 border-2 border-border border-t-teal rounded-full animate-spin" />
          <span className="text-sm font-mono animate-pulse">Awaiting response...</span>
        </div>
      ) : !response ? (
        <div className="flex-1 flex items-center justify-center text-center text-text-muted italic px-8">
          {emptyMessage}
        </div>
      ) : (
        <>
          {/* Response Header Info */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
            <div className="flex items-center gap-4 text-sm font-mono">
              <span className="text-text-secondary">Status:</span>
              <span className={`font-bold ${getStatusColor(response.status)}`}>{response.status || 'Error'}</span>

              {response.time !== undefined && (
                <>
                  <span className="w-px h-4 bg-border" />
                  <span className="text-text-secondary">Time:</span>
                  <span className="text-teal font-medium">{response.time} ms</span>
                </>
              )}
            </div>
          </div>

          {/* Response Tabs */}
          <div className="flex gap-1 border-b border-border mb-4">
            {(['body', 'headers'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setResTab(t)}
                className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-150 border-b-2 -mb-px ${
                  resTab === t
                    ? 'text-teal border-teal'
                    : 'text-text-secondary border-transparent hover:text-text-primary'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Response Content */}
          <div className="flex-1 overflow-auto custom-scrollbar">
            {resTab === 'body' && (
              <div className="h-full">
                {typeof response.data === 'object' ? (
                  <CodeBlock code={JSON.stringify(response.data, null, 2)} maxHeight="100%" />
                ) : (
                  <CodeBlock code={String(response.data)} maxHeight="100%" />
                )}
              </div>
            )}
            {resTab === 'headers' && (
              <div className="h-full">
                <CodeBlock code={JSON.stringify(response.headers || {}, null, 2)} maxHeight="100%" />
              </div>
            )}
          </div>
        </>
      )}
    </Card>
  )
}
