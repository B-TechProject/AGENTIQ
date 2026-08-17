/**
 * Shared shape for the probe tools that Phase 8 implements.
 *
 * These are registered NOW with their real names, risk classes, and input and
 * output schemas, because the registry, permission gate and audit trail are
 * what Phase 5 exists to make true. Only the detection logic is outstanding.
 *
 * They return `{ notImplemented: true }` rather than a plausible-looking
 * finding. docs/01_PRD.md is unambiguous about this: Sem 6's security agent
 * reported results it had not measured, and that single decision is what made
 * its whole Chapter 4 indefensible. A tool that says "not built yet" costs
 * nothing; one that invents a finding costs the project.
 */
import { z } from 'zod';

/** Every probe takes the same target description. */
export const probeInputSchema = z.object({
  url: z.url(),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).default('GET'),
  headers: z.record(z.string(), z.string()).default({}),
  body: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
  /**
   * The user's declaration that this endpoint is meant to be reachable
   * anonymously. This single flag is what kills the most visible Sem 6 false
   * positive: an anonymous 200 from a public endpoint is CORRECT behaviour, and
   * the old auth probe flagged every public API as vulnerable.
   */
  intendedPublic: z.boolean().default(false),
});

export const findingSchema = z.object({
  family: z.string(),
  owasp: z.string(),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  vulnerable: z.boolean(),
  payload: z.string().nullable(),
  signal: z.string().nullable(),
  baseline: z.string().nullable(),
  explanation: z.string(),
  remediation: z.string(),
});

export const probeOutputSchema = z.object({
  family: z.string(),
  owasp: z.string(),
  notImplemented: z.boolean(),
  findings: z.array(findingSchema),
});

/** The stub handler. Reports honestly; never fabricates a finding. */
export function notImplementedHandler(family, owasp) {
  return async () => ({
    family,
    owasp,
    notImplemented: true,
    findings: [],
  });
}
