/**
 * Security headers probe — registered now, detection logic lands in Phase 8.
 *
 * Risk class network.read — this probe only reads response metadata, it sends no payload.
 * See _probeStub.js for why this returns notImplemented rather than a finding.
 */
import { defineTool } from '../registry.js';
import { RISK_CLASS } from '../permissions.js';
import { probeInputSchema, probeOutputSchema, notImplementedHandler } from './_probeStub.js';

export const inputSchema = probeInputSchema;
export const outputSchema = probeOutputSchema;

export default defineTool({
  name: 'probe_headers',
  title: 'Security headers probe',
  description: 'Check for HSTS, CSP, X-Content-Type-Options and X-Frame-Options.',
  riskClass: RISK_CLASS.NETWORK_READ,
  inputSchema,
  outputSchema,
  handler: notImplementedHandler('headers', 'API8:2023 Security Misconfiguration'),
});
