# AGENTIQ — resume entry

Paste-ready content for the LNMIIT pod.ai **Add Project** form. Every figure here is
measured and reproducible (`npm run evaluate` → `docs/90_EVALUATION.md`), so all of it
survives being questioned in an interview.

---

## Project title

```
AGENTIQ — AI-Driven Agentic Platform for Autonomous API Testing, Security Validation & Deployment
```

Shorter variant if the field is tight:

```
AGENTIQ — Agentic Platform for API Testing & Security Validation
```

## Dates

Semester 7 B.Tech Project. The Sem 7 rebuild began **17 August 2026**; earlier commits in
the repository are the Semester 6 version this work replaced. Use the dates your
department recorded.

## Mentor / Team Size

Fill these in yourself — I do not know your assigned mentor, and the team size should match
what your department has on record.

---

## Key Skills / Expertise involved

Press Enter after each. The form treats anything comma- or space-separated as one entry,
so add them one at a time.

```
Node.js
Express.js
MongoDB
React
TypeScript
Model Context Protocol (MCP)
AWS Bedrock
Amazon Nova
LLM Application Development
API Security Testing
OWASP API Security Top 10
SSRF Prevention
Automated Test Generation
Mutation Testing
OAuth 2.0
JWT Authentication
Docker
CI/CD
GitHub Actions
Vitest
Zod
Tailwind CSS
System Design
```

---

## Description

Paste the block below. It is roughly 2,900 characters, well inside the 6,000 limit.

---

AGENTIQ is an agentic platform that generates executable API test cases with an LLM, runs
them, probes six vulnerability families, and can deploy a service and then test what it
just deployed. It is a Semester 7 rebuild of a Semester 6 prototype whose evaluation and
security findings did not hold up under inspection.

ARCHITECTURAL CONTRIBUTION

The central design decision is that an agent never performs I/O. Every outbound request
passes through one of nine tools in a Model Context Protocol registry, and each call is
schema-validated, permission-checked against a declared risk class, SSRF-guarded, and
written to an append-only audit log. This is enforced mechanically rather than by
convention: a build-breaking test fails if an HTTP client is imported anywhere user input
reaches. That guard caught a live SSRF vulnerability in an unrewritten route, where a
user-supplied URL was passed straight to an HTTP client and could retrieve cloud instance
metadata credentials.

Permissions are granted per risk class and per host rather than per tool, because asking a
user to approve nine tools individually is theatre. The class that sends attack payloads is
never auto-granted under any configuration.

MEASURED RESULTS

Evaluation runs against two purpose-built fixture applications with identical routes, seed
data and response contracts, differing only in their defects — so a finding on one and not
the other can only be explained by the defect.

- Security detection: 100% precision and 100% recall across 48 labelled observations
  (16 true positives, 0 false positives, 0 false negatives).
- False-positive rate on the hardened application: 0%.
- Test-generation adequacy measured by mutation score, adapting the RESTestBench
  methodology: 50.0% with OpenAPI grounding against 43.3% without, over three repeated
  runs per arm.
- Cost: approximately $0.0002 per generation on AWS Bedrock (Amazon Nova Lite), with a
  Groq fallback.

The grounding result is reported as suggestive rather than significant, because the ranges
overlap at that sample size. Three mutants that neither configuration ever killed are
listed in the report as concrete limitations of the generator.

ENGINEERING

453 automated tests with an enforced 70% coverage gate on the tool and agent layers
(actual: 92%), green CI, and a verified fresh-clone-to-running path. Deliberate design
choices include the LLM proposing assertions while a deterministic tool decides pass or
fail — so a green run means the API is correct, not that the model was self-consistent.

Building the evaluation harness surfaced several real defects in the system under test,
including an SSRF guard whose DNS-pinning path had never executed because every test used a
literal IP address, and an MCP transport that served only one concurrent client.

Stack: Node.js, Express, MongoDB Atlas, React 19, TypeScript, Vite, Tailwind CSS, AWS
Bedrock, Docker, GitHub Actions.

---

## A note on how to talk about it

The strongest thing about this project is not the pass rate — it is that the numbers are
measured, the limitations are stated, and several of the bugs were found by the project's
own evaluation harness. If an interviewer pushes on any figure, the honest answer is
available and it is a better answer than a rounder number would be.
