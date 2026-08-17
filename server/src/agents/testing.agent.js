/**
 * TESTING AGENT — the first real inhabitant of server/src/agents/.
 *
 * ⚠️ THIS FILE PERFORMS NO I/O. It may not import axios, fetch, node:http, or
 * any HTTP client. server/tests/architecture.test.js fails the build if it
 * does. Every request this agent causes is made by the `run_test_case` MCP
 * tool, which is schema-validated, permission-checked, SSRF-guarded and
 * audited. That separation IS the project's contribution — from this commit
 * onward the guard is load-bearing rather than vacuous.
 *
 * docs/01_PRD.md F2, docs/02_TRD.md §6. What changed from Sem 6:
 *
 *   - Multi-assertion, not status-code-only. Sem 6's status-only assertions are
 *     why its pass rate carried almost no information.
 *   - NO hardcoded fallback cases. Sem 6 returned three fake tests named
 *     "Fallback Valid Request" when the model failed, so a broken run looked
 *     like a successful one. Generation failure is now a visible error.
 *   - `discarded` is reported, not hidden.
 *   - The LLM PROPOSES assertions; run_test_case DECIDES pass/fail.
 */
import { z } from 'zod';
import { generateJSON } from '../services/llm.js';
import { assertionSchema } from '../mcp/tools/run_test_case.js';

/** What the model must produce. Anything else is discarded and counted. */
export const generatedCaseSchema = z.object({
  name: z.string().min(1).max(160),
  intent: z.string().min(1).max(400),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']),
  path: z.string().default(''),
  headers: z.record(z.string(), z.string()).default({}),
  body: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
  assertions: z.array(assertionSchema).min(1).max(8),
  category: z.enum(['positive', 'negative', 'boundary']),
});

export const generationSchema = z.object({
  cases: z.array(generatedCaseSchema).min(1).max(12),
});

export const SYSTEM_PROMPT = `You are a senior QA engineer who writes precise, executable API tests.

Return ONLY a JSON object of the form { "cases": [ ... ] }. No prose, no markdown, no code fences.

Each case must have:
  name        short human-readable title
  intent      one sentence: what this verifies and why
  method      GET | POST | PUT | PATCH | DELETE | HEAD | OPTIONS
  path        path/query to append to the base URL, or "" for the base URL itself
  headers     object of request headers (may be {})
  body        request body for write methods (omit for GET)
  category    positive | negative | boundary
  assertions  1-8 assertions from the list below

Assertion kinds, and their exact shapes:
  { "kind": "status",            "expected": 200 }
  { "kind": "responseTimeUnder", "ms": 2000 }
  { "kind": "jsonPathExists",    "path": "$.id" }
  { "kind": "jsonPathEquals",    "path": "$.role", "value": "user" }
  { "kind": "jsonPathType",      "path": "$.items", "type": "array" }
  { "kind": "headerPresent",     "name": "content-type" }
  { "kind": "headerEquals",      "name": "content-type", "value": "application/json" }
  { "kind": "bodyMatches",       "pattern": "^\\\\{" }

Rules:
  - Assert what the endpoint SHOULD do. Never weaken an assertion to make it pass.
  - A negative case must expect a failure status. Do not rewrite it to expect 200.
  - jsonPath uses $.a.b and $.a[0] only.
  - Cover at least one positive, one negative and one boundary case.`;

/** Builds the user prompt, grounded in a spec operation when one is supplied. */
export function buildPrompt({ url, method, description, count = 4, operation = null }) {
  const lines = [
    `Base URL: ${url}`,
    `Primary method: ${method}`,
    `What this endpoint is for: ${description}`,
    '',
    `Generate exactly ${count} test cases.`,
  ];

  if (operation) {
    // Spec-grounded generation (docs/01_PRD.md F4). Assertions should reference
    // DECLARED response fields rather than fields the model imagined.
    lines.push(
      '',
      'This endpoint is described by an OpenAPI operation. Ground every assertion in it.',
      `Operation: ${operation.method} ${operation.path}`,
      operation.summary ? `Summary: ${operation.summary}` : '',
      operation.parameters?.length
        ? `Parameters: ${operation.parameters.map((p) => `${p.name} (${p.in}${p.required ? ', required' : ''})`).join(', ')}`
        : 'Parameters: none',
      operation.responses?.length
        ? `Declared responses: ${operation.responses.map((r) => `${r.status} ${r.description ?? ''}`.trim()).join(' | ')}`
        : '',
      operation.security?.length ? `Security schemes: ${operation.security.join(', ')}` : '',
      '',
      'Use the declared status codes. Assert on fields the specification actually declares.',
    );
  }

  return lines.filter(Boolean).join('\n');
}

/** Joins a base URL and a model-supplied path without duplicating slashes. */
export function joinUrl(base, suffix) {
  if (!suffix) return base;
  try {
    return new URL(suffix, base.endsWith('/') ? base : `${base}/`).toString();
  } catch {
    return base;
  }
}

/**
 * Generate test cases. Pure: no network, no database.
 *
 * @returns {{ cases, discarded, discardReasons, tokens, provider, model, costUsd }}
 */
export async function generateCases({
  url, method = 'GET', description, count = 4, operation = null, llm = generateJSON,
}) {
  const result = await llm({
    system: SYSTEM_PROMPT,
    prompt: buildPrompt({ url, method, description, count, operation }),
    schema: generationSchema,
    maxTokens: 2400,
  });

  // Cases that survived the object-level schema but are individually unusable
  // are DISCARDED AND COUNTED, never silently dropped (docs/01_PRD.md F2).
  const kept = [];
  const discardReasons = [];
  for (const c of result.data.cases) {
    const parsed = generatedCaseSchema.safeParse(c);
    if (!parsed.success) {
      discardReasons.push(parsed.error.issues[0]?.message ?? 'invalid case');
      continue;
    }
    kept.push({ ...parsed.data, url: joinUrl(url, parsed.data.path) });
  }

  return {
    cases: kept,
    discarded: result.data.cases.length - kept.length,
    discardReasons,
    provider: result.provider,
    model: result.model,
    tokens: { input: result.inputTokens, output: result.outputTokens },
    costUsd: result.costUsd,
    attempts: result.attempts,
    generationMs: result.durationMs,
  };
}

/**
 * Execute generated cases through the MCP tool layer.
 *
 * `runTool` is injected — the agent never imports the tool registry directly, so
 * it cannot accidentally acquire a path to the network, and tests can drive it
 * with a stub. Every invocation here produces an audit row.
 */
export async function executeCases({ cases, runTool, context = {} }) {
  const results = [];
  for (const testCase of cases) {
    const outcome = await runTool('run_test_case', {
      name: testCase.name,
      url: testCase.url,
      method: testCase.method,
      headers: testCase.headers,
      ...(testCase.body === undefined ? {} : { body: testCase.body }),
      assertions: testCase.assertions,
    }, context);

    results.push({ ...outcome, intent: testCase.intent, category: testCase.category });
  }
  return results;
}

/** Summary numbers for the run header. `discarded` is surfaced, never hidden. */
export function summarise(results, discarded = 0) {
  return {
    totalTests: results.length,
    passed: results.filter((r) => r.status === 'pass').length,
    failed: results.filter((r) => r.status === 'fail').length,
    errored: results.filter((r) => r.status === 'error').length,
    discarded,
    assertionsEvaluated: results.reduce((n, r) => n + (r.assertions?.length ?? 0), 0),
  };
}

/**
 * The full agent: generate, then execute.
 *
 * Note what is NOT here — no axios, no fetch, no direct database access. The
 * agent orchestrates; the tools act.
 */
export async function runTestingAgent({
  url, method = 'GET', description, count = 4, operation = null,
  runTool, context = {}, llm = generateJSON,
}) {
  const generated = await generateCases({ url, method, description, count, operation, llm });

  if (generated.cases.length === 0) {
    // Every case was discarded. Fail visibly rather than returning an empty
    // "successful" run that a reader would mistake for a clean result.
    const err = new Error(
      `Test generation produced no usable cases (${generated.discarded} discarded: ` +
      `${generated.discardReasons.slice(0, 3).join('; ')})`,
    );
    err.code = 'GEN_FAILED';
    err.details = generated;
    throw err;
    }

  const results = await executeCases({ cases: generated.cases, runTool, context });

  return {
    summary: summarise(results, generated.discarded),
    functional: results,
    generation: {
      provider: generated.provider,
      model: generated.model,
      tokens: generated.tokens,
      costUsd: generated.costUsd,
      attempts: generated.attempts,
      generationMs: generated.generationMs,
      grounded: Boolean(operation),
    },
  };
}

export default runTestingAgent;
