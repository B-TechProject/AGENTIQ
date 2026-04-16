import { useState } from 'react'
import { Badge }     from '@/components/ui/Badge'
import { Card }      from '@/components/ui/Card'
import { Modal }     from '@/components/ui/Modal'
import { ResponseViewer } from '@/components/ui/ResponseViewer'
import { useDebounce }    from '@/hooks/useDebounce'
import { METHOD_VARIANTS } from '@/constants'
import { apiService, CustomResponseData } from '@/services/api'
import { useEffect } from 'react'

type StatusFilter = 'all' | 'pass' | 'fail'

export function HistoryPage() {
  const [search, setSearch]     = useState('')
  const [status, setStatus]     = useState<StatusFilter>('all')
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
  const [historyList, setHistoryList] = useState<any[]>([])
  
  // Modal Fetch State
  const [modalResponse, setModalResponse] = useState<CustomResponseData | null>(null)
  const [modalLoading, setModalLoading] = useState(false)

  const debouncedSearch = useDebounce(search, 250)

  // Fetch History
  useEffect(() => {
    apiService.getHistory().then(res => {
        if (res?.data?.success && Array.isArray(res.data.data)) {
            setHistoryList(res.data.data)
        }
    }).catch(err => {
        console.error("Failed to fetch history", err)
    })
  }, [])

  // Fetch individual run when modal opens
  useEffect(() => {
    if (!selectedRunId) {
        setModalResponse(null)
        return
    }
    setModalLoading(true)
    apiService.getRunById(selectedRunId).then(res => {
        setModalResponse(res)
    }).catch(err => {
        console.error("Failed fetching run info", err)
    }).finally(() => {
        setModalLoading(false)
    })
  }, [selectedRunId])

  const filtered = historyList.filter((r) => {
    if (!r.url) return false
    const matchUrl    = r.url.toLowerCase().includes(debouncedSearch.toLowerCase())
    const matchStatus = status === 'all' || r.status === status
    return matchUrl && matchStatus
  })

  return (
    <div className="animate-fade-in">
      <div className="mb-7">
        <h1 className="text-2xl font-extrabold tracking-tight mb-1">Test History</h1>
        <p className="text-sm text-text-secondary">All previous test runs and their results</p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: 'Total Runs',  value: historyList.length,                              color: '#00d4aa' },
          { label: 'Passed',      value: historyList.filter(r => r.status === 'pass').length, color: '#22c55e' },
          { label: 'Failed',      value: historyList.filter(r => r.status === 'fail').length, color: '#ef4444' },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="text-[11px] font-mono text-text-muted uppercase tracking-widest mb-2">{s.label}</div>
            <div className="text-3xl font-extrabold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <Card>
        <div className="p-5">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
            <div className="section-title">Recent Runs</div>
            <div className="flex gap-2">
              <input
                className="input-field"
                style={{ width: 220, padding: '7px 12px' }}
                placeholder="Filter by URL…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                className="input-field cursor-pointer"
                style={{ width: 130, padding: '7px 12px', background: '#091221' }}
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusFilter)}
              >
                <option value="all"  style={{ background: '#091221' }}>All Status</option>
                <option value="pass" style={{ background: '#091221' }}>Passed</option>
                <option value="fail" style={{ background: '#091221' }}>Failed</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {['Date / Time','API URL','Method','Tests','Status','Duration','Action'].map((h) => (
                    <th key={h} className="text-left px-3 py-3 text-[11px] font-mono text-text-muted uppercase tracking-wide border-b border-border whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-10 text-center text-text-muted text-sm">
                      No runs match your filter
                    </td>
                  </tr>
                ) : filtered.map((r, i) => (
                  <tr
                    key={r._id || r.id || i}
                    className="table-row cursor-pointer"
                    onClick={() => setSelectedRunId(r._id || r.id)}
                  >
                    <td className="px-3 py-3 font-mono text-xs text-text-muted border-b border-border/50 whitespace-nowrap">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : r.date}</td>
                    <td className="px-3 py-3 text-teal border-b border-border/50 max-w-[220px]">
                      <span className="block truncate">{r.url}</span>
                    </td>
                    <td className="px-3 py-3 border-b border-border/50">
                      <Badge variant={METHOD_VARIANTS[r.method] as any || 'gray'}>{r.method}</Badge>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-text-secondary border-b border-border/50">{r.tests || r.summary?.total || 0}</td>
                    <td className="px-3 py-3 border-b border-border/50">
                      <Badge variant={r.status === 'pass' ? 'green' : 'red'}>{r.status?.toUpperCase() || 'UNKNOWN'}</Badge>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-text-secondary border-b border-border/50">{r.duration || 'N/A'}</td>
                    <td className="px-3 py-3 border-b border-border/50">
                      <button
                        className="btn-ghost text-xs py-1 px-3"
                        onClick={(e) => { e.stopPropagation(); setSelectedRunId(r._id || r.id) }}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination stub */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <span className="text-xs text-text-muted font-mono">
              {filtered.length} of {historyList.length} runs
            </span>
            <div className="flex gap-1">
              {[1, 2, 3].map((p) => (
                <button key={p}
                  className={`w-7 h-7 rounded text-xs font-mono transition-all ${
                    p === 1 ? 'bg-teal/10 text-teal border border-teal/30' : 'text-text-muted hover:text-text-primary'
                  }`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Modal
        open={!!selectedRunId}
        onClose={() => setSelectedRunId(null)}
        title={selectedRunId ? `Run Details — ${selectedRunId}` : ''}
        size="lg"
      >
        <div style={{ height: 400 }}>
            <ResponseViewer response={modalResponse} loading={modalLoading} emptyMessage="Fetching run details..." />
        </div>
        <div className="flex justify-end gap-2 mt-5">
            <button className="btn-ghost" onClick={() => setSelectedRunId(null)}>Close</button>
        </div>
      </Modal>
    </div>
  )
}
