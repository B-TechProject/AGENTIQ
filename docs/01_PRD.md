# 01 — What you are building, and why

### AgentIQ — AI-Driven Agentic Platform for Autonomous API Testing, Security Validation & Deployment Assistance

**Program:** B.Tech CSE Final Year Project (BTP), LNMIIT Jaipur · Semester 7, Aug–Dec 2026
**Team:** Adarsh Dwivedi (23UCS509), Aditya Gupta (23UCS513), Hiitesh Gour (23UCS590)
**Supervisor:** Dr. Rukhsar Sultana, Assistant Professor, CSE
**Repository:** `github.com/B-TechProject/AGENTIQ`
**Status:** Sem 6 shipped a partial system. Sem 7 completes it. Read [00_SEM6_AUDIT.md](00_SEM6_AUDIT.md) first.

> These docs are written *to the builder*, as instructions — not as a report.
> **01** is what and why · **[02](02_TRD.md)** is how it is wired · **[03](03_App_Flow.md)** is
> how it behaves · **[04](04_App_UI.md)** is how it looks. **[MASTER_PROMPT.md](../MASTER_PROMPT.md)**
> is the order you build it in. If you are starting from zero, go to the master prompt.

---

## 1. The one-sentence pitch

You are building a tool where a developer pastes an API URL and a sentence of English, and gets
back **executed** functional tests, a **real** OWASP-informed security scan, and a deployment
that re-validates itself — every action taken through a permissioned, audited MCP tool layer, so
you can always answer *"why did it do that?"*

Hold that sentence. Every feature below either serves it or gets cut.

## 2. The problem you are solving

Four things are broken, and you should be able to say all four from memory in a viva:

- **Fragmented tooling.** Functional testing lives in Postman, security testing in ZAP, and
  deployment verification nowhere. Three tools, three mental models, no shared context. A
  developer who wants to know "is this endpoint correct *and* safe *and* live?" runs three
  workflows and correlates the results by hand.
- **Manual authoring cost.** Writing assertions by hand is slow and biased by whatever the
  author happened to think of. Boundary and negative cases are exactly the ones humans skip.
- **No semantic layer.** Existing tools operate on syntax — a URL, a schema, a payload. None of
  them understand *intent*. "This endpoint should reject a login with a valid email but wrong
  password" is not expressible in Postman without writing the test yourself.
- **Unaccountable automation.** The moment you let an LLM take actions against a live endpoint,
  you have created a machine that fires HTTP requests on someone's behalf. If there is no
  permission model and no audit trail, that is not a testing tool — it is a liability. Most
  LLM-agent demos ignore this entirely.

That last point is the one that makes this a project rather than a wrapper. **The contribution
is not "an LLM writes tests." It is "an LLM takes actions through a schema-validated,
permission-gated, fully audited tool layer, and the whole trace is reconstructable."**

## 3. Where the project actually stands

Be precise about this internally, even though the outward framing is *refinement*.

| Area | Sem 6 | Sem 7 target |
|---|---|---|
| Testing Agent | Single LLM call → status-code assertion only | Multi-assertion, spec-grounded, retry-aware |
| Security Agent | 3 probes; **sends no payload when driven from the UI** | 6 probe families, OWASP-mapped, FP-controlled |
| MCP layer | A UI badge reading "MCP Powered" | Real MCP server, 8 tools, permissions, audit |
| OpenAPI ingestion | None | Spec import → grounded generation |
| Deployment Agent | Mock form, "Coming Soon" | Real Render deploy + post-deploy re-validation |
| Dashboard | Hardcoded literals (`2,847`, `142ms`) | Live Mongo aggregates |
| Evaluation | 5 GETs against jsonplaceholder | Mutation-based benchmark, reported honestly |
| Auth, persistence, history | Working | Keep, harden |

**Sem 6 delivered ~25–30% of the proposal.** That is a normal first-semester outcome. The job
now is to close it, not to relitigate it.

## 4. Goals

1. Ship a **real MCP tool layer** — every agent action goes through a registered tool with a
   declared input/output schema, a permission check, and an audit record. No exceptions, no
   side channels.
2. Make the **Security Agent actually fire payloads**, map findings to OWASP API Security Top 10
   (2023), and control false positives well enough to publish a measured FP rate.
3. Ground test generation in **OpenAPI specifications** when one is available, falling back to
   description-driven generation when it is not.
4. Ship a **Deployment Agent** that genuinely deploys to Render and re-runs the Testing and
   Security agents against the live URL.
5. Replace every mock in the UI with **real data**, on a light, professional interface.
6. Produce an **honest evaluation chapter** — a measured number, not a demo screenshot.
7. Make the repository **clone-and-run** on macOS, Linux and Windows with no code edits.

### Non-goals — say no to these, explicitly, in the report

Writing these down is what keeps the semester survivable:

- **Fine-tuning any model.** Listed in Sem 6 future work. Cut. No GPU budget, no corpus, no time.
- **Browser extension for traffic capture.** Cut. Interesting, orthogonal, a whole project.
- **Graph-based stateful test orchestration** (login → token → protected call chains). Cut, with
  one exception: a single-hop auth token handoff is in scope because auth probes need it.
- **A vector database or embedding-based RAG.** You are doing *specification retrieval*, which is
  the honest form of the retrieval claim. Do not add pgvector to satisfy a word in an abstract.
- **Destructive security testing.** No DELETE against arbitrary hosts, no data exfiltration, no
  actual exploitation. Detection only. This is a hard ethical boundary, not a preference.
- **Native mobile apps.** Responsive web only.
- **Multi-user teams, orgs, RBAC.** One user owns their runs. That is enough.

## 5. Who uses it

| Persona | What they want | What they get |
|---|---|---|
| **Backend developer** (primary) | "Did I break the contract?" in under a minute | Paste URL + intent → executed tests with real assertions |
| **Student / solo dev** (primary) | Security awareness without learning ZAP | Six probe families with plain-English findings and remediation |
| **Evaluator / examiner** (critical) | Evidence the claims are true | Audit log, tool registry page, evaluation numbers, one-command setup |

That third persona is not a joke. **Design for the examiner.** If a claim in the report cannot be
demonstrated in one click from the running app, either build the click or delete the claim.

## 6. Features

Priorities: **P0** must ship or the project fails · **P1** should ship · **P2** only if time remains.

---

### F1 · MCP Tool Layer — P0, the headline

The single most important feature. Everything else routes through it.

An MCP server exposes the platform's capabilities as **registered tools**. Agents never call
`axios` directly; they call a tool. Each tool declares a Zod input schema and an output schema.
Every invocation is permission-checked and written to an audit collection.

**Tools to register:**

| Tool | Purpose | Risk class |
|---|---|---|
| `http_request` | Execute one arbitrary HTTP request, return status/headers/body/timing | `network.read` |
| `run_test_case` | Execute a test case and evaluate its assertions | `network.read` |
| `probe_sqli` | Inject SQLi indicator payloads, fingerprint DB errors | `network.probe` |
| `probe_xss` | Inject reflection payload, check for unescaped echo | `network.probe` |
| `probe_auth` | Re-request with credentials stripped, compare | `network.probe` |
| `probe_cors` | Inspect CORS policy for permissive origin + credentials | `network.read` |
| `probe_headers` | Check HSTS, CSP, X-Content-Type-Options, X-Frame-Options | `network.read` |
| `parse_openapi` | Parse and dereference an OpenAPI 3.x document | `local.compute` |
| `deploy_service` | Create/trigger a Render deployment | `deploy.write` |

**Acceptance criteria:**
- `GET /api/mcp/tools` returns the live registry with full JSON Schemas, generated from the Zod
  definitions — never hand-written, or it will drift.
- A tool call with a malformed input is rejected by schema validation *before* any network I/O.
- A tool in a risk class the user has not granted returns a permission error and writes a
  `denied` audit record.
- Every invocation writes `{ runId, tool, riskClass, inputHash, outcome, durationMs, ts }`.
- The UI has a **Tool Registry** page listing every tool, its schema, and its risk class, and an
  **Audit Log** page showing real invocations. *These two pages are how you prove the claim.*

> **Design note worth defending in the viva:** the permission grant is per-session and per-risk-class,
> not per-tool. Asking a user to approve nine tools individually is theatre; asking them to approve
> "this app may send probe traffic to hosts you nominate" is a real decision.

---

### F2 · Testing Agent — P0

Natural-language intent + endpoint metadata → executable test cases → executed results.

**Upgrades over Sem 6:**
- **Multi-assertion.** Not just status code. Support: `status`, `responseTimeUnder`, `jsonPath
  exists`, `jsonPath equals`, `jsonPath type`, `headerPresent`, `headerEquals`, `bodyMatches`.
  Sem 6's status-only assertions are why its pass rate was meaningless.
- **Spec-grounded when a spec exists** (see F4).
- **Deterministic normalisation.** Keep the Sem 6 JSON-repair pipeline — it was genuinely good
  work — but remove the `GET + expected 400 → 200` rewrite. That rule inflated pass rates and
  cannot be defended.
- **Structured output.** Use the provider's JSON mode; validate against a Zod schema; discard
  unrecoverable cases and *report the discard count* rather than hiding it.
- **Bounded retry.** One repair attempt on invalid JSON, then fail loudly. No silent fallbacks
  that fabricate test cases — Sem 6's hardcoded fallback array made failures look like successes.

**Acceptance criteria:**
- Given a URL, method and description, returns ≥ 4 structurally valid cases covering at least one
  positive, one negative, and one boundary.
- Every executed case reports expected vs actual **per assertion**, not per case.
- Generation failure surfaces as a visible error, never as fabricated tests.
- Discarded/malformed case count is shown in the run summary.

---

### F3 · Security Agent — P0, rebuild from scratch

Sem 6's version does not send payloads when driven from the UI. Do not patch it; rewrite it.

**Six probe families, each mapped to OWASP API Security Top 10 (2023):**

| Probe | OWASP | Detection signal |
|---|---|---|
| SQL injection | API8:2023 Security Misconfiguration | DB error fingerprints (MySQL, PostgreSQL, SQLite, MSSQL, Oracle, SQLSTATE, ODBC) **or** a differential response between benign and payload requests |
| Reflected XSS | API8:2023 | Payload echoed unescaped in an HTML-ish response |
| Broken authentication | API2:2023 Broken Authentication | Credentials stripped → still 2xx **and** response materially differs from an anonymous baseline |
| CORS misconfiguration | API8:2023 | `Access-Control-Allow-Origin: *` **with** `Allow-Credentials: true`, or origin reflection |
| Missing security headers | API8:2023 | HSTS, CSP, X-Content-Type-Options, X-Frame-Options absent |
| Rate limiting absent | API4:2023 Unrestricted Resource Consumption | N rapid requests, all 2xx, no `429`, no `Retry-After` |

**The false-positive problem is the actual engineering here.** Two mechanisms:

1. **Baseline differential.** Every probe first sends a benign request and stores the baseline
   (status, length, content-type, timing band). A finding requires a *material deviation* from
   baseline, not an absolute condition. This is what kills Sem 6's "any 500 = SQLi" rule.
2. **Explicit endpoint intent.** The user declares whether the endpoint is *intended to be
   public*. Sem 6's auth probe flagged every public API as vulnerable, which is the single most
   visible defect in the report. A public endpoint returning 200 anonymously is **correct
   behaviour**, and the tool must say so.

**Every finding carries:** severity (critical/high/medium/low), OWASP category, the exact payload
sent, the observed signal, a plain-English explanation, and a remediation sentence.

**Hard safety rules — non-negotiable:**
- Read-only and non-destructive. Never `DELETE`, never `DROP`, never data modification beyond
  what a single benign request causes.
- Rate-limit outbound probe traffic (default ≤ 5 req/s per target host).
- **Refuse private and link-local address space** — see the SSRF section in [02](02_TRD.md#ssrf).
  A tool that fetches user-supplied URLs from a server is an SSRF engine unless you stop it.
- Require explicit user acknowledgement before the first scan of any new host.

**Acceptance criteria:**
- Against a deliberately vulnerable fixture app (you will build one — see F10), detects SQLi, XSS,
  auth bypass, CORS misconfiguration and missing headers.
- Against a hardened version of the *same* app, reports **zero** findings.
- Against five public APIs declared as "intended public", reports zero auth findings.
- The measured false-positive rate goes in the report. A real number beats a claim.

---

### F4 · OpenAPI Ingestion — P0

The honest form of the "retrieval-augmented" claim in the Sem 6 abstract: retrieve the endpoint's
declared contract, and ground generation in it.

- Import a spec by URL or file upload (OpenAPI 3.0 / 3.1, JSON or YAML).
- Parse, dereference `$ref`s, validate.
- List operations; the user picks one or many.
- Generation prompt is grounded in the operation's real parameters, request schema, response
  schemas and declared status codes.
- Security schemes in the spec pre-populate the auth configuration.

**Acceptance criteria:**
- Handles a real-world spec (use the Petstore 3.1 spec plus one large public spec).
- Spec-grounded generation produces assertions referencing **declared** response fields, and this
  is measurably better than description-only generation on the F10 harness.
- Malformed spec → clear parse error naming the offending path, not a stack trace.

> This is your strongest evaluation story: *the same generator, with and without spec grounding,
> measured on the same benchmark.* That is a result, not a feature.

---

### F5 · Deployment Agent — P1

Sem 6 shipped a form with a "Coming Soon" badge. Make it real, or cut it honestly — do not ship
a third mock.

- Connect a Render API key (stored encrypted, never logged).
- Pre-flight: repo reachable, branch exists, build command present, required env vars declared.
- Trigger deploy via the Render API; poll status.
- **On success, automatically re-run the Testing Agent and Security Agent against the live URL** and
  attach the results to the deployment record.

That last bullet is the whole point. A deployment that verifies itself is a genuine contribution;
a deploy button is not.

**Acceptance criteria:** one end-to-end run — repo → live URL → post-deploy test + scan → stored
record, visible in history.

**If it will not land by mid-November, cut it and say so in the report.** A well-argued
scoped-out feature costs nothing. A third mock costs your credibility.

---

### F6 · Dashboard & History — P0

Every number comes from Mongo. Delete `MOCK_PULSE_DATA`, `MOCK_AGENTS`, `logRows`, the hardcoded
`statCards`, and the `Simulation Mode` badge.

- KPI cards: total runs, tests executed, pass rate, open findings by severity, median latency —
  all real aggregates over the signed-in user's runs.
- Run pulse: passed/failed by day, last 14 days, from a real aggregation pipeline.
- Recent activity: real runs, click through to detail.
- Empty state for a new account that says what to do next, not a zero-filled chart.

**Acceptance criteria:** a brand-new account shows honest zeros and a call to action. Every number
traces to a query you can show an examiner.

---

### F7 · Auth & Account — P0 (mostly done)

JWT email/password + Google OAuth 2.0 already work. Keep them. Harden:
- Remove the hardcoded JWT secret fallback; fail fast at boot if `JWT_SECRET` is unset.
- Unify `mongoUsers` and `googleUsers` into one `User` model with an `authProviders` array. Two
  collections for one concept is a data-model smell an examiner will pick at.
- Server must boot without Google OAuth configured (lazy strategy registration).
- Rate-limit auth endpoints.

---

### F8 · API Client — P1 (mostly done)

The Postman-like ad-hoc request page works. Keep it, add: header/param/body editors with
validation, response timing breakdown, save request to a collection, "promote this request into a
test case", and "scan this endpoint" — turning the client into the on-ramp for the other features.

---

### F9 · Explainability & Audit — P0, the trust layer

- **Run detail** shows every assertion with expected vs actual, and for failures an LLM-generated
  explanation. Fix the Sem 6 bug where the explanation fired once per *process* instead of once
  per run.
- **Audit Log page**: filterable list of tool invocations — tool, risk class, target host,
  outcome, duration, timestamp.
- **Tool Registry page**: every registered tool with its live JSON Schema.
- **"Why?" affordance on every finding**: payload sent, signal observed, baseline compared against.

Borrowed directly from KADI's design principle, and it is the right one: *nothing is a black box.*

---

### F10 · Evaluation Harness — P0, this is your Chapter 4

Sem 6's Chapter 4 was five GETs against jsonplaceholder with a near-tautological pass rate. Replace
it with a real measurement.

**Build two fixture apps** (small Express services, in-repo, `fixtures/`):
- `vulnerable-api` — deliberately vulnerable: string-concatenated SQL, unescaped reflection, no
  auth on a privileged route, `ACAO: *` with credentials, no security headers, no rate limit.
- `hardened-api` — same routes and contract, all defects fixed.

**Then measure:**
1. **Security detection:** true positives on `vulnerable-api`, false positives on `hardened-api`.
   Report precision and recall per probe family.
2. **Test-generation adequacy:** seed the hardened app with N deliberate behavioural mutations
   (wrong status code, missing field, off-by-one boundary, wrong content type). Measure what
   fraction of mutations the generated suite kills. This is the mutation-score methodology from
   RESTestBench (arXiv 2604.25862) — cite it and adapt it.
3. **Grounding ablation:** the same measurement with spec grounding on vs off.
4. **Cost and latency:** tokens and wall-clock per run.

**Acceptance criteria:** `npm run evaluate` produces a reproducible results table. That table is
Chapter 4. Whatever the number is, report it — a measured 61% is a stronger result than an
unmeasured claim of success.

---

## 7. What "good" looks like

| Metric | Target | How measured |
|---|---|---|
| Clone-to-running | ≤ 5 minutes, zero code edits, macOS/Linux/Windows | Fresh clone on a clean machine |
| Server boots without optional config | Always | No `GOOGLE_CLIENT_ID` → still boots |
| Generated cases structurally valid | ≥ 95% | Harness over 50 generations |
| Security false-positive rate on `hardened-api` | 0 findings | F10 harness |
| Security recall on `vulnerable-api` | ≥ 5 of 6 families | F10 harness |
| Mutation score, spec-grounded | Report honestly; beat un-grounded | F10 harness |
| Every agent action audited | 100% | Audit count == tool-call count |
| p95 run latency (4 tests, no scan) | < 15 s | Instrumented |
| Monthly running cost | ₹0 | Free tiers only |

## 8. Risks, and what you do about each

| Risk | Mitigation |
|---|---|
| **Solo capacity + placements** | Phases are independently shippable. After Phase 3 you have a defensible project even if everything later slips. Ship in that order. |
| **Viva on code you did not hand-write** | Non-negotiable: after each phase, you read the diff and can explain it. Budget 30 min per phase. This is the single highest-value use of your time. |
| **LLM provider changes or rate-limits** | Provider abstraction behind one interface; Groq primary, Gemini secondary, both free-tier. Drop Pollinations entirely — an unauthenticated third-party proxy has no place in a security project. |
| **Deployment Agent slips** | Cut it in November with a written justification. Do not ship a mock. |
| **Scope creep back toward the 9-objective proposal** | The non-goals list in §4 is binding. Re-read it monthly. |
| **Someone finds the leaked JWT secret** | Rotate in Phase 1, before anything else. |

## 9. Semester plan

| Weeks | Phase | Deliverable |
|---|---|---|
| 1 | 0–1 | Repo organised, cleaned, secrets rotated, clone-and-run |
| 2–3 | 2 | New stack, foundation, CI, fixtures |
| 4–5 | 3 | **MCP layer + registry + audit** ← the claim becomes true |
| 6 | 4 | Testing Agent v2 |
| 7–8 | 5 | Security Agent rebuild |
| 9 | 6 | OpenAPI ingestion |
| 10–11 | 8–9 | Frontend rebuild, real dashboard |
| 12 | 7 | Deployment Agent (or documented cut) |
| 13 | 10 | Evaluation harness + results |
| 14–15 | 11–12 | Hardening, deploy, report, viva pack |

**Mid-semester checkpoint (end of week 5):** if the MCP layer is not done, drop F5 and F8 without
further discussion and go straight to F3.

## 10. Submission checklist

- [ ] Live deployed URL, reachable
- [ ] `README.md` with a 5-minute quickstart that a stranger can follow
- [ ] Tool Registry and Audit Log pages populated with real data
- [ ] Evaluation table with real numbers, reproducible via `npm run evaluate`
- [ ] Both fixture apps in-repo and runnable
- [ ] Scoped-out features stated explicitly with justification
- [ ] Demo script — see [03](03_App_Flow.md), Part C
- [ ] No secret in git history; no `node_modules` tracked
- [ ] Final report chapters aligned to what actually exists
