/**
 * Reflected XSS probe — registered now, detection logic lands in Phase 8.
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
  name: 'probe_xss',
  title: 'Reflected XSS probe',
  description: 'Send a reflection payload and check whether it is echoed unescaped into an HTML-ish response.',
  riskClass: RISK_CLASS.NETWORK_PROBE,
  inputSchema,
  outputSchema,
  handler: notImplementedHandler('xss', 'API8:2023 Security Misconfiguration'),
});
