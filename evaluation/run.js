#!/usr/bin/env node
/**
 * `npm run evaluate` — the evaluation harness.
 *
 * The script is wired now so the command exists from Phase 3 onward and CI can
 * reference it, but the harness itself is Phase 14 work and depends on the
 * fixture apps built in Phase 6.
 *
 * It exits NON-ZERO and says exactly what is missing. It does not print a
 * plausible-looking table. Reporting numbers that were never measured is the
 * single failure mode this project exists to avoid — Sem 6's Chapter 4 was five
 * GETs against jsonplaceholder with a near-tautological pass rate, and the whole
 * point of docs/01_PRD.md F10 is to replace that with a real measurement.
 */
process.stderr.write(`
  AGENTIQ evaluation harness — NOT YET IMPLEMENTED

  Planned for Phase 14 (docs/01_PRD.md F10, MASTER_PROMPT.md Phase 14).
  It depends on the fixture apps from Phase 6:

    fixtures/vulnerable-api   deliberately defective
    fixtures/hardened-api     same contract, defects fixed

  When built, this command will measure and write docs/90_EVALUATION.md:
    1. Security detection  — precision/recall per probe family
    2. Test adequacy       — mutation score (RESTestBench, arXiv 2604.25862)
    3. Grounding ablation  — spec-grounded vs description-only
    4. Cost and latency    — tokens and wall-clock per run

  Exiting non-zero rather than emitting an unmeasured table.

`);
process.exit(1);
