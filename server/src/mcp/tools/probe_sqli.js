/**
 * SQL injection probe — registered now, detection logic lands in Phase 8.
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
  name: 'probe_sqli',
  title: 'SQL injection probe',
  description: 'Send SQL-injection indicator payloads and fingerprint database errors against a baseline.',
  riskClass: RISK_CLASS.NETWORK_PROBE,
  inputSchema,
  outputSchema,
  handler: notImplementedHandler('sqli', 'API8:2023 Security Misconfiguration'),
});
