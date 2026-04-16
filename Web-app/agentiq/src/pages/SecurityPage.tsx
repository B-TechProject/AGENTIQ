import { useState } from 'react'
import { Shield } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { ResponseViewer } from '@/components/ui/ResponseViewer'
import { useToastStore } from '@/store/toastStore'
import { apiService, CustomResponseData } from '@/services/api'


export function SecurityPage() {
  const toast = useToastStore()
  const [url, setUrl]       = useState('https://api.example.com/v1')
  const [scanning, setScan] = useState(false)
  const [response, setResponse] = useState<CustomResponseData | null>(null)

  const handleScan = async () => {
    if (!url.trim()) { toast.show('Enter a target URL', 'warning', '⚠'); return }
    setScan(true)
    setResponse(null)
    
    try {
      const res = await apiService.securityScan({ url })
      setResponse(res)
      toast.show('Security scan complete', 'success', '🛡')
    } catch (err: any) {
      toast.show('Scan failed', 'error', '✕')
    } finally {
      setScan(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-7">
        <h1 className="text-2xl font-extrabold tracking-tight mb-1">Security Scanner</h1>
        <p className="text-sm text-text-secondary">Autonomous vulnerability detection and security analysis</p>
      </div>

      {/* Config Card */}
      <Card className="p-5 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="input-label">Target URL</label>
            <input
              className="input-field"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.example.com"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              className="btn-primary whitespace-nowrap disabled:opacity-50"
              onClick={handleScan}
              disabled={scanning}
            >
              {scanning
                ? <><span className="spinner" style={{width:13,height:13}} /> Scanning…</>
                : <><Shield size={13} /> Start Security Scan</>}
            </button>
          </div>
        </div>
      </Card>

      <div className="flex-1 mt-2">
        <ResponseViewer 
          response={response} 
          loading={scanning} 
          emptyMessage="Enter a URL and start a scan to detect vulnerabilities" 
        />
      </div>
    </div>
  )
}
