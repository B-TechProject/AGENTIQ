/**
 * CORS misconfiguration probe — registered now, detection logic lands in Phase 8.
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
  name: 'probe_cors',
  title: 'CORS misconfiguration probe',
  description: 'Inspect the CORS policy for a permissive origin combined with credentials, or origin reflection.',
  riskClass: RISK_CLASS.NETWORK_READ,
  inputSchema,
  outputSchema,
  handler: notImplementedHandler('cors', 'API8:2023 Security Misconfiguration'),
});
