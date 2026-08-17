/**
 * deploy_service — trigger a deployment.
 *
 * docs/01_PRD.md F5, retargeted from Render to AWS App Runner by
 * docs/05_AWS_ARCHITECTURE.md. Phase 13 implements it.
 *
 * Registered now because its RISK CLASS is the point. deploy.write is the only
 * class that mutates infrastructure outside AGENTIQ, and it is the only one
 * requiring both a grant AND an explicit per-action confirmation — approving
 * "this app may deploy" is not the same as approving a particular deployment.
 *
 * Returns notImplemented rather than a fake deployment record. docs/01_PRD.md
 * F5 is explicit: "Do not ship a third mock."
 */
import { z } from 'zod';
import { defineTool } from '../registry.js';
import { RISK_CLASS } from '../permissions.js';

export const inputSchema = z.object({
  provider: z.enum(['apprunner']).default('apprunner'),
  repo: z.string().min(1),
  branch: z.string().min(1).default('main'),
  serviceName: z.string().min(1),
  envVars: z.record(z.string(), z.string()).default({}),
});

export const outputSchema = z.object({
  notImplemented: z.boolean(),
  provider: z.string(),
  status: z.string(),
  serviceId: z.string().nullable(),
  liveUrl: z.string().nullable(),
  message: z.string(),
});

export default defineTool({
  name: 'deploy_service',
  title: 'Deploy service',
  description:
    'Create or trigger an AWS App Runner deployment, then re-run the testing and security ' +
    'agents against the live URL. Requires an explicit deploy.write grant and confirmation.',
  riskClass: RISK_CLASS.DEPLOY_WRITE,
  inputSchema,
  outputSchema,
  async handler(input) {
    return {
      notImplemented: true,
      provider: input.provider,
      status: 'not_implemented',
      serviceId: null,
      liveUrl: null,
      message:
        'The deployment agent is Phase 13 work. It is registered here so its risk class, ' +
        'schema and audit behaviour are real now. No deployment was attempted.',
    };
  },
});
