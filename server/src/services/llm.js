/**
 * LLM provider abstraction — ONE interface, several providers.
 *
 * docs/02_TRD.md §6 and docs/05_AWS_ARCHITECTURE.md:
 *
 *     generateJSON({ system, prompt, schema })
 *
 * Groq is primary (free, fast, llama-3.1-8b-instant). Bedrock is the fallback,
 * reached through the Converse API so switching model family is a config change
 * rather than a code change.
 *
 * POLLINATIONS IS DELETED, NOT DISABLED.
 * Sem 6 fell back to an unauthenticated third-party LLM proxy (ai.service.js:97)
 * — sending user API payloads to an anonymous endpoint. docs/01_PRD.md §8 is
 * explicit: it has no place in a security project.
 *
 * WHY THIS IS A SERVICE AND NOT AN MCP TOOL
 * The MCP layer governs actions taken against USER-NOMINATED targets: that is
 * what needs a permission gate, an SSRF guard and a per-host audit row. An LLM
 * call goes to a fixed, first-party endpoint and is the agent's own reasoning,
 * not an action on a user's behalf. The architecture guard forbids network I/O
 * inside server/src/agents/**, and an agent reaching a model through this
 * service does not violate that: no agent opens a socket, and nothing here can
 * be pointed at a host the user supplied.
 *
 * Token usage is returned on every call because docs/01_PRD.md F10 requires
 * cost and latency per run in Chapter 4.
 */
import axios from 'axios';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';
import { parseLooseJson } from './jsonRepair.js';

export class LlmError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'LlmError';
    this.code = code;
    this.details = details;
  }
}

export const LLM_ERROR = {
  NO_PROVIDER: 'LLM_NO_PROVIDER',
  PROVIDER_FAILED: 'LLM_PROVIDER_FAILED',
  INVALID_JSON: 'LLM_INVALID_JSON',
  SCHEMA_MISMATCH: 'LLM_SCHEMA_MISMATCH',
  RATE_LIMITED: 'LLM_RATE_LIMITED',
};

/** Published per-million-token prices, for the cost column in Chapter 4. */
export const PRICING = {
  'llama-3.1-8b-instant': { in: 0.05, out: 0.08 },
  'apac.amazon.nova-lite-v1:0': { in: 0.06, out: 0.24 },
  'apac.amazon.nova-micro-v1:0': { in: 0.035, out: 0.14 },
  'apac.amazon.nova-pro-v1:0': { in: 0.8, out: 3.2 },
};

export function estimateCostUsd(model, inputTokens, outputTokens) {
  const p = PRICING[model];
  if (!p) return null;
  return (inputTokens / 1e6) * p.in + (outputTokens / 1e6) * p.out;
}

// ── Providers ────────────────────────────────────────────────────────────────

export const GROQ_MODEL = 'llama-3.1-8b-instant';

/** Groq — OpenAI-compatible chat completions with JSON mode. */
async function callGroq({ system, prompt, maxTokens, temperature, signal }) {
  if (!env.GROQ_API_KEY) throw new LlmError(LLM_ERROR.NO_PROVIDER, 'GROQ_API_KEY is not set');

  let res;
  try {
    res = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature,
        max_tokens: maxTokens,
      },
      {
        headers: { Authorization: `Bearer ${env.GROQ_API_KEY}` },
        timeout: 60_000,
        signal,
      },
    );
  } catch (err) {
    if (err.response?.status === 429) {
      throw new LlmError(LLM_ERROR.RATE_LIMITED, 'Groq rate limit reached', { provider: 'groq' });
    }
    throw new LlmError(LLM_ERROR.PROVIDER_FAILED, `Groq request failed: ${err.message}`, {
      provider: 'groq',
      status: err.response?.status,
    });
  }

  const usage = res.data?.usage ?? {};
  return {
    text: res.data?.choices?.[0]?.message?.content ?? '',
    provider: 'groq',
    model: GROQ_MODEL,
    inputTokens: usage.prompt_tokens ?? 0,
    outputTokens: usage.completion_tokens ?? 0,
  };
}

let bedrockClient = null;

/**
 * Bedrock via the Converse API.
 *
 * Converse normalises request and response across every model family, so
 * BEDROCK_MODEL_ID can be swapped between Nova, Qwen, Mistral or Claude without
 * touching this function. invoke-model would need a different body per vendor.
 *
 * BEDROCK_MODEL_ID must be an INFERENCE PROFILE id (a `global.` / `apac.` /
 * `us.` prefix). A bare model id fails with "on-demand throughput isn't
 * supported" — see docs/05_AWS_ARCHITECTURE.md.
 */
async function callBedrock({ system, prompt, maxTokens, temperature }) {
  if (!env.BEDROCK_MODEL_ID) {
    throw new LlmError(LLM_ERROR.NO_PROVIDER, 'BEDROCK_MODEL_ID is not set');
  }

  const { BedrockRuntimeClient, ConverseCommand } = await import('@aws-sdk/client-bedrock-runtime');
  bedrockClient ??= new BedrockRuntimeClient({ region: env.AWS_REGION });

  let res;
  try {
    res = await bedrockClient.send(new ConverseCommand({
      modelId: env.BEDROCK_MODEL_ID,
      system: [{ text: system }],
      messages: [{ role: 'user', content: [{ text: prompt }] }],
      inferenceConfig: { maxTokens, temperature },
    }));
  } catch (err) {
    if (err.name === 'ThrottlingException') {
      throw new LlmError(LLM_ERROR.RATE_LIMITED, 'Bedrock throttled', { provider: 'bedrock' });
    }
    throw new LlmError(LLM_ERROR.PROVIDER_FAILED, `Bedrock request failed: ${err.message}`, {
      provider: 'bedrock',
      awsCode: err.name,
    });
  }

  return {
    text: res.output?.message?.content?.[0]?.text ?? '',
    provider: 'bedrock',
    model: env.BEDROCK_MODEL_ID,
    inputTokens: res.usage?.inputTokens ?? 0,
    outputTokens: res.usage?.outputTokens ?? 0,
  };
}

export const PROVIDERS = { groq: callGroq, bedrock: callBedrock };

/** Which providers are actually usable right now. Drives /api/health. */
export function availableProviders() {
  return {
    groq: Boolean(env.GROQ_API_KEY),
    bedrock: Boolean(env.BEDROCK_MODEL_ID),
  };
}

/** Primary first, then fallback, skipping anything unconfigured. */
export function providerOrder({ primary = env.LLM_PRIMARY, fallback = env.LLM_FALLBACK } = {}) {
  const available = availableProviders();
  return [primary, fallback].filter((p, i, arr) => p && available[p] && arr.indexOf(p) === i);
}

// ── The one interface ────────────────────────────────────────────────────────

/**
 * Generate JSON validated against a Zod schema.
 *
 * ONE bounded repair retry, then a visible failure. There is NO hardcoded
 * fallback: Sem 6 returned three fake test cases named "Fallback Valid
 * Request" when the model failed, which made a broken run look like a
 * successful one. A generation failure must surface as an error
 * (docs/03_App_Flow.md B1).
 *
 * @returns {Promise<{data, provider, model, inputTokens, outputTokens, costUsd,
 *                    attempts, repairStage, durationMs}>}
 */
export async function generateJSON({
  system,
  prompt,
  schema,
  maxTokens = 2048,
  temperature = 0.2,
  maxRepairs = 1,
  providers = providerOrder(),
  signal,
} = {}) {
  if (!providers.length) {
    throw new LlmError(
      LLM_ERROR.NO_PROVIDER,
      'No LLM provider is configured. Set GROQ_API_KEY or BEDROCK_MODEL_ID.',
    );
  }

  const started = Date.now();
  const failures = [];

  for (const name of providers) {
    const call = PROVIDERS[name];
    let lastText = null;
    let lastIssue = null;

    for (let attempt = 0; attempt <= maxRepairs; attempt += 1) {
      // The repair attempt shows the model its own output and the specific
      // problem, rather than blindly asking again — a bare retry at the same
      // temperature usually reproduces the same malformed shape.
      const effectivePrompt = attempt === 0
        ? prompt
        : `${prompt}\n\nYour previous reply could not be used: ${lastIssue}\n` +
          `Previous reply:\n${String(lastText).slice(0, 1500)}\n\n` +
          'Reply again with ONLY valid JSON matching the required shape. No prose, no code fences.';

      let raw;
      try {
        raw = await call({ system, prompt: effectivePrompt, maxTokens, temperature, signal });
      } catch (err) {
        failures.push(`${name}: ${err.message}`);
        break; // try the next provider
      }

      lastText = raw.text;

      const parsed = parseLooseJson(raw.text);
      if (!parsed.ok) {
        lastIssue = 'the reply was not valid JSON';
        logger.warn({ provider: name, attempt }, 'LLM returned unparseable JSON');
        continue;
      }

      const validated = schema ? schema.safeParse(parsed.value) : { success: true, data: parsed.value };
      if (!validated.success) {
        lastIssue = validated.error.issues
          .slice(0, 4)
          .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
          .join('; ');
        logger.warn({ provider: name, attempt, issue: lastIssue }, 'LLM output failed schema');
        continue;
      }

      return {
        data: validated.data,
        provider: raw.provider,
        model: raw.model,
        inputTokens: raw.inputTokens,
        outputTokens: raw.outputTokens,
        costUsd: estimateCostUsd(raw.model, raw.inputTokens, raw.outputTokens),
        attempts: attempt + 1,
        repairStage: parsed.stage,
        durationMs: Date.now() - started,
      };
    }

    if (lastIssue) failures.push(`${name}: ${lastIssue} (after ${maxRepairs + 1} attempts)`);
  }

  // Fail loudly. Never fabricate.
  throw new LlmError(
    LLM_ERROR.INVALID_JSON,
    `Generation failed after trying ${providers.join(' then ')}. ${failures.join(' | ')}`,
    { failures, providers },
  );
}

export default { generateJSON, availableProviders, providerOrder, estimateCostUsd };
