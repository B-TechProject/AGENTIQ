/**
 * Server state — TanStack Query.
 *
 * Every hook here talks to a real endpoint. There is no mock layer and no
 * fallback data: when a query has nothing, the screen renders an empty state
 * (docs/04_App_UI.md §1 — "Zero is zero. Empty is empty.").
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiDelete } from '@/services/api';
import type {
  TestRun, McpTool, AuditEvent, ApiSpec, Grant, RiskClass, HealthStatus, HttpMethod,
} from '@/types';

/* ── Health ───────────────────────────────────────────────────────────────── */

export const useHealth = () => useQuery({
  queryKey: ['health'],
  queryFn: () => apiGet<HealthStatus>('/health'),
  refetchInterval: 60_000,
  retry: false,
});

/* ── MCP: the two pages that prove the claim ──────────────────────────────── */

export interface ToolRegistry {
  count: number;
  generatedFrom: string;
  note: string;
  riskClasses: {
    name: RiskClass; label: string; description: string;
    autoGranted: boolean; requiresHost: boolean; requiresConfirmation: boolean;
  }[];
  tools: McpTool[];
}

export const useTools = () => useQuery({
  queryKey: ['mcp', 'tools'],
  queryFn: () => apiGet<ToolRegistry>('/mcp/tools'),
});

export const useAudit = (filters: {
  outcome?: string; tool?: string; runId?: string; limit?: number;
} = {}) => useQuery({
  queryKey: ['mcp', 'audit', filters],
  queryFn: () => apiGet<{ total: number; count: number; events: AuditEvent[] }>('/mcp/audit', filters),
});

/* ── Grants — the server side of the permission sheet ─────────────────────── */

export const useGrants = () => useQuery({
  queryKey: ['mcp', 'grants'],
  queryFn: () => apiGet<{ sessionId: string; grants: Grant[] }>('/mcp/grants'),
});

export function useGrantHost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { riskClass: RiskClass; host?: string; confirmed?: boolean }) =>
      apiPost<{ grant: Grant }>('/mcp/grants', vars),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mcp', 'grants'] }),
  });
}

export function useRevokeGrant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { riskClass: RiskClass; host?: string }) =>
      apiDelete<{ revoked: number }>('/mcp/grants', vars),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mcp', 'grants'] }),
  });
}

/* ── Runs ─────────────────────────────────────────────────────────────────── */

export interface StartRunInput {
  url: string;
  method: HttpMethod;
  description: string;
  count?: number;
  intendedPublic?: boolean;
  specRef?: string;
  operationIndex?: number;
}

export function useStartRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: StartRunInput) => apiPost<{ run: TestRun }>('/runs', input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['runs'] });
      qc.invalidateQueries({ queryKey: ['mcp', 'audit'] });
    },
  });
}

export const useRuns = (limit = 50) => useQuery({
  queryKey: ['runs', limit],
  queryFn: () => apiGet<{ total: number; count: number; runs: TestRun[] }>('/runs', { limit }),
});

export const useRun = (id: string | undefined) => useQuery({
  queryKey: ['runs', id],
  queryFn: () => apiGet<{ run: TestRun }>(`/runs/${id}`),
  enabled: Boolean(id),
});

/* ── Specs ────────────────────────────────────────────────────────────────── */

export const useSpecs = () => useQuery({
  queryKey: ['specs'],
  queryFn: () => apiGet<{ total: number; specs: ApiSpec[] }>('/specs'),
});

export const useSpec = (id: string | undefined) => useQuery({
  queryKey: ['specs', id],
  queryFn: () => apiGet<{ spec: ApiSpec }>(`/specs/${id}`),
  enabled: Boolean(id),
});

export function useImportSpec() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { url: string } | { spec: string; filename?: string }) =>
      apiPost<{ spec: ApiSpec; warnings: string[] }>('/specs/import', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['specs'] }),
  });
}

/* ── Ad-hoc request (API client, F8) ──────────────────────────────────────── */

export function useSendRequest() {
  return useMutation({
    mutationFn: (input: {
      url: string; method: HttpMethod;
      headers?: Record<string, string>; body?: unknown;
    }) => apiPost<{
      status: number; headers: Record<string, string>;
      body: string; bytes: number; durationMs: number; ip: string;
    }>('/request/send', input),
  });
}
