import { useMutation, useQuery } from '@tanstack/react-query'
import { apiService, GeneratePayload } from '@/services/api'
import { useToastStore } from '@/store/toastStore'

export function useHistory() {
  return useQuery({
    queryKey: ['history'],
    queryFn: apiService.getHistory,
    retry: false,
  })
}

export function useRunById(id: string) {
  return useQuery({
    queryKey: ['run', id],
    queryFn: () => apiService.getRunById(id),
    enabled: !!id,
  })
}

export function useGenerateTests() {
  const toast = useToastStore()
  return useMutation({
    mutationFn: (payload: GeneratePayload) => apiService.generate(payload),
    onSuccess: (data: any) => {
      const count = data?.data?.tests?.length || 0
      toast.show(`${count} tests generated`, 'success', '🧬')
    },
    onError: () => {
      toast.show('Backend unavailable — using AI fallback', 'warning', '⚡')
    },
  })
}

export function useRunTests() {
  const toast = useToastStore()
  return useMutation({
    mutationFn: (payload: GeneratePayload) => apiService.run(payload),
    onSuccess: () => {
      toast.show('Tests completed', 'success', '✓')
    },
    onError: () => {
      toast.show('Backend unavailable — using AI fallback', 'warning', '⚡')
    },
  })
}

export function useDeploy() {
  const toast = useToastStore()
  return useMutation({
    mutationFn: ({ repo, platform, branch }: { repo: string; platform: string; branch: string }) =>
      apiService.deploy(repo, platform, branch),
    onSuccess: () => {
      toast.show('Deployment initiated!', 'success', '🚀')
    },
    onError: () => {
      toast.show('Deployment feature coming soon', 'warning', '⚡')
    },
  })
}
