import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input, Select } from '@/components/ui/Input'
import { CodeBlock } from '@/components/ui/CodeBlock'
import { Loader } from '@/components/ui/Loader'
import { ResponseViewer } from '@/components/ui/ResponseViewer'
import { useToastStore } from '@/store/toastStore'
import { apiService, CustomResponseData } from '@/services/api'
import { Trash2, Plus, Zap } from 'lucide-react'

const methodOptions = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'].map((m) => ({
  value: m,
  label: m,
}))

type KeyValueRow = { id: number; key: string; value: string; enabled: boolean }

export function ApiClientPage() {
  const toast = useToastStore()

  // Request Config
  const [method, setMethod] = useState('GET')
  const [url, setUrl] = useState('')
  const [params, setParams] = useState<KeyValueRow[]>([{ id: Date.now(), key: '', value: '', enabled: true }])
  const [headers, setHeaders] = useState<KeyValueRow[]>([{ id: Date.now(), key: '', value: '', enabled: true }])
  const [body, setBody] = useState('')
  
  // UI State
  const [reqTab, setReqTab] = useState<'params' | 'headers' | 'body'>('params')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<CustomResponseData | null>(null)

  // Handlers for KeyValue arrays
  const handleKvChange = (type: 'params' | 'headers', id: number, field: keyof KeyValueRow, val: any) => {
    const updater = type === 'params' ? setParams : setHeaders
    updater(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p))
  }

  const handleKvRemove = (type: 'params' | 'headers', id: number) => {
    const updater = type === 'params' ? setParams : setHeaders
    updater(prev => prev.filter(p => p.id !== id))
  }

  const handleKvAdd = (type: 'params' | 'headers') => {
    const updater = type === 'params' ? setParams : setHeaders
    updater(prev => [...prev, { id: Date.now(), key: '', value: '', enabled: true }])
  }

  const handleSend = async () => {
    if (!url.trim()) {
      toast.show('Please enter a valid URL', 'error')
      return
    }

    setLoading(true)
    setResponse(null)

    try {
      // Build final objects
      const finalHeaders: Record<string, string> = {}
      headers.filter(h => h.enabled && h.key.trim()).forEach(h => {
        finalHeaders[h.key.trim()] = h.value
      })

      const finalParams: Record<string, string> = {}
      params.filter(p => p.enabled && p.key.trim()).forEach(p => {
        finalParams[p.key.trim()] = p.value
      })

      let finalBody = undefined
      if (body.trim() && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        try {
          finalBody = JSON.parse(body)
        } catch {
          // If not valid JSON, send as raw text or just leave it as is
          finalBody = body
        }
      }

      const res = await apiService.sendRequest({
        url,
        method,
        headers: finalHeaders,
        params: finalParams,
        body: finalBody,
      })

      setResponse(res)
    } catch (err: any) {
      if (err.response?.data) {
        setResponse({
            status: err.response.data.status || err.response.status,
            data: err.response.data.data || err.response.data,
            headers: err.response.data.headers || err.response.headers,
            time: err.response.data.time || 0
        })
      } else {
        toast.show(err.message, 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  const renderKvEditor = (type: 'params' | 'headers', rows: KeyValueRow[]) => (
    <div className="flex flex-col gap-2">
      {rows.map(row => (
        <div key={row.id} className="flex items-center gap-2">
          <input 
            type="checkbox" 
            checked={row.enabled} 
            onChange={(e) => handleKvChange(type, row.id, 'enabled', e.target.checked)}
            className="w-4 h-4 rounded border-border bg-bg-secondary text-teal focus:ring-teal"
          />
          <input
            placeholder="Key"
            className="input-field flex-1"
            value={row.key}
            onChange={(e) => handleKvChange(type, row.id, 'key', e.target.value)}
          />
          <input
            placeholder="Value"
            className="input-field flex-1"
            value={row.value}
            onChange={(e) => handleKvChange(type, row.id, 'value', e.target.value)}
          />
          <button 
            onClick={() => handleKvRemove(type, row.id)}
            className="p-2.5 text-text-muted hover:text-red transition-colors bg-bg-secondary rounded border border-border hover:border-red"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <button onClick={() => handleKvAdd(type)} className="btn-ghost self-start flex items-center gap-1 mt-2 text-sm pt-1 pb-1">
        <Plus size={14} /> Add Row
      </button>
    </div>
  )

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-6rem)]">

      <div className="mb-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded flex items-center justify-center bg-teal/10 text-teal shrink-0">
          <Zap size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight mb-0.5">API Client</h1>
          <p className="text-xs text-text-secondary">Send requests and view structured responses</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 flex-1 min-h-0">
        
        {/* LEFT PANEL: Request Configuration */}
        <div className="flex flex-col gap-4 flex-1 lg:max-w-[50%] min-h-0">
          <Card className="p-4 flex flex-col h-full min-h-0">
            {/* Action Bar */}
            <div className="flex gap-2 mb-6">
                <div className="w-32 z-10 relative">
                    <Select options={methodOptions} value={method} onChange={(e) => setMethod(e.target.value)} />
                </div>
                <div className="flex-1">
                    <input
                        className="input-field w-full h-10"
                        placeholder="https://api.example.com/v1/users"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                </div>
                <button className="btn-primary h-10 px-6 gap-2" onClick={handleSend} disabled={loading}>
                    {loading ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Zap size={16} />}
                    Send
                </button>
            </div>

            {/* Request Tabs */}
            <div className="flex gap-1 border-b border-border mb-4">
              {(['params', 'headers', 'body'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setReqTab(t)}
                  className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-150 border-b-2 -mb-px ${
                    reqTab === t
                      ? 'text-teal border-teal'
                      : 'text-text-secondary border-transparent hover:text-text-primary'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Request Content */}
            <div className="flex-1 overflow-auto custom-scrollbar pr-2">
                {reqTab === 'params' && renderKvEditor('params', params)}
                {reqTab === 'headers' && renderKvEditor('headers', headers)}
                {reqTab === 'body' && (
                    <div className="h-full flex flex-col gap-2">
                        <div className="text-[10px] text-text-muted font-mono uppercase tracking-widest pl-1">JSON Payload</div>
                        <textarea
                            className="input-field flex-1 font-mono text-sm resize-none"
                            placeholder="{\n  &#34;key&#34;: &#34;value&#34;\n}"
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            spellCheck={false}
                        />
                    </div>
                )}
            </div>
          </Card>
        </div>

        {/* RIGHT PANEL: Response View */}
        <div className="flex flex-col gap-4 flex-1 min-h-0">
          <ResponseViewer response={response} loading={loading} emptyMessage="Enter a URL and click Send to get a response" />
        </div>

      </div>
    </div>
  )
}
