/**
 * GET /api/health — liveness plus dependency status.
 *
 * docs/02_TRD.md §10 and §13. Also the target for the warm ping that mitigates
 * free-tier cold starts before a demo.
 *
 * Everything reported here is derived from real state. The frontend's provider
 * chip reads this endpoint rather than rendering a static badge — Sem 6's topbar
 * asserted "MCP Powered" and "Agents Online" as hardcoded chips.
 */
import { Router } from 'express';
import { mongoStatus } from '../lib/db.js';
import { isGoogleOAuthConfigured } from '../config/passport.js';
import { env } from '../config/env.js';
import { ok } from '../utils/http.js';

const router = Router();

/** Providers are "configured" only when a key is actually present. */
export function llmProviders() {
  return [
    { name: 'groq', configured: Boolean(env.GROQ_API_KEY), role: env.LLM_PRIMARY === 'groq' ? 'primary' : 'fallback' },
    { name: 'bedrock', configured: Boolean(env.BEDROCK_MODEL_ID), role: env.LLM_PRIMARY === 'bedrock' ? 'primary' : 'fallback' },
  ];
}

router.get('/health', (req, res) => {
  const mongo = mongoStatus();
  return ok(res, {
    status: mongo === 'connected' ? 'ok' : 'degraded',
    uptime: Math.round(process.uptime()),
    mongo,
    llmProviders: llmProviders(),
    googleOAuth: isGoogleOAuthConfigured() ? 'configured' : 'disabled',
    env: env.NODE_ENV,
  });
});

export default router;
