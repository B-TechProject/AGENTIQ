import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FlaskConical, Zap } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input, Select } from '@/components/ui/Input'
import { Loader } from '@/components/ui/Loader'
import { ResponseViewer } from '@/components/ui/ResponseViewer'
import { useToastStore } from '@/store/toastStore'
import { apiService, CustomResponseData } from '@/services/api'


const schema = z.object({
  url: z.string().url('Enter a valid URL'),
  method: z.string(),
  description: z.string().min(3, 'Describe what the endpoint should do'),
})

type FormData = z.infer<typeof schema>

const methodOptions = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map((m) => ({
  value: m,
  label: m,
}))

const typeColor: Record<string, string> = {
  functional: 'teal',
  security: 'red',
  edge: 'orange',
}

export function TestRunnerPage() {
  const location = useLocation()
  const toast = useToastStore()

  const [generating, setGenerating] = useState(false)
  const [running, setRunning] = useState(false)
  
  // Track raw responses from backend calls
  const [activeTab, setActiveTab] = useState<'generate' | 'run'>('run')
  const [generateResponse, setGenerateResponse] = useState<CustomResponseData | null>(null)
  const [runResponse, setRunResponse] = useState<CustomResponseData | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { url: '', method: 'GET', description: '' },
  })

  // Prefill
  useEffect(() => {
    const state = location.state as { url?: string; desc?: string } | null
    if (state?.url) setValue('url', state.url)
    if (state?.desc) setValue('description', state.desc)
  }, [location.state, setValue])

  // ── GENERATE TESTS ───────────────────────────────
  const handleGenerate = async (data: FormData) => {
    setGenerating(true)
    try {
      const res = await apiService.generate({
        url: data.url,
        method: data.method,
        description: data.description,
      })

      setGenerateResponse(res)
      setActiveTab('generate')
      toast.show(`Tests generated successfully`, 'success', '🧬')
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to generate tests'

      toast.show(message, 'error', '✕')
    } finally {
      setGenerating(false)
    }
  }

  // ── RUN TESTS ───────────────────────────────────
  const handleRun = async (data: FormData) => {
    setRunning(true)
    setRunResponse(null)

    try {
      const res = await apiService.run({
        url: data.url,
        method: data.method,
        description: data.description,
      })

      setRunResponse(res)
      setActiveTab('run')
      toast.show('Tests completed', 'success', '✓')
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to run tests'

      toast.show(message, 'error', '✕')
    } finally {
      setRunning(false)
    }
  }

  // ── DATA PROCESSING ─────────────────────────────
  const currentResponse = activeTab === 'generate' ? generateResponse : runResponse
  const currentLoading = activeTab === 'generate' ? generating : running

  // ── UI ─────────────────────────────────────────
  return (
    <div className="animate-fade-in">
      <div className="mb-7">
        <h1 className="text-2xl font-extrabold mb-1">Test Runner</h1>
        <p className="text-sm text-text-secondary">
          Generate and execute AI-powered test suites
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* LEFT PANEL */}
        <div className="flex flex-col gap-4">
          <Card className="p-5">
            <div className="mb-5 font-semibold">Configure Test</div>

            <form className="flex flex-col gap-4">
              <Input
                label="API URL"
                type="url"
                error={errors.url?.message}
                {...register('url')}
              />

              <Select
                label="Method"
                options={methodOptions}
                {...register('method')}
              />

              <Input
                label="Description"
                error={errors.description?.message}
                {...register('description')}
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-ghost flex-1"
                  onClick={handleSubmit(handleGenerate)}
                  disabled={generating}
                >
                  {generating ? 'Generating...' : 'Generate Tests'}
                </button>

                <button
                  type="button"
                  className="btn-orange flex-1"
                  onClick={handleSubmit(handleRun)}
                  disabled={running}
                >
                  {running ? 'Running...' : 'Run Tests'}
                </button>
              </div>
            </form>
          </Card>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex flex-col flex-1">
          <div className="flex justify-between items-center mb-5">
            <div className="font-semibold">Backend Output</div>
            <div className="flex gap-2">
                <button 
                  className={`px-3 py-1 text-xs rounded border transition-colors ${activeTab === 'generate' ? 'bg-bg-secondary text-teal border-teal' : 'border-transparent text-text-muted hover:text-white'}`}
                  onClick={() => setActiveTab('generate')}
                >
                  Generation Data
                </button>
                <button 
                  className={`px-3 py-1 text-xs rounded border transition-colors ${activeTab === 'run' ? 'bg-bg-secondary text-orange border-orange' : 'border-transparent text-text-muted hover:text-white'}`}
                  onClick={() => setActiveTab('run')}
                >
                  Test Results
                </button>
            </div>
          </div>

          <div className="flex-1 mt-2 -mx-4 -mb-4">
            <ResponseViewer 
              response={currentResponse} 
              loading={currentLoading} 
              emptyMessage={activeTab === 'generate' ? 'Generate tests to view output' : 'Run tests to view results'} 
            />
          </div>
        </div>
      </div>
    </div>
  )
}