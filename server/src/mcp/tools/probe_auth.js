/**
 * Broken authentication probe — registered now, detection logic lands in Phase 8.
 *
 * Risk class network.probe — NEVER auto-granted, because this sends attack-indicator payloads.
 * See _probeStub.js for why this returns notImplemented rather than a finding.
 */
import { defineTool } from '../registry.js';
import { RISK_CLASS } from '../permissions.js';
import { probeInputSchema, probeOutputSchema, notImplementedHandler } from './_probeStub.js';

export const inputSchema = probeInputSchema;
export const outputSchema = probeOutputSchema;

export default defineTool({
  name: 'probe_auth',
  title: 'Broken authentication probe',
  description: 'Re-request with credentials stripped and compare against an authenticated baseline.',
  riskClass: RISK_CLASS.NETWORK_PROBE,
  inputSchema,
  outputSchema,
  handler: notImplementedHandler('auth', 'API2:2023 Broken Authentication'),
});
