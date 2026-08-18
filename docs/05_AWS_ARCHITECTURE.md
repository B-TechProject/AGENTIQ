# 05 — AWS architecture

### Decision record, service map, and what changes per phase

> **Status:** decided 17 Aug 2026 (Adarsh). Supersedes the Render/free-tier deployment plan in
> [02_TRD.md](02_TRD.md) §13. Everything else in the TRD — the MCP layer, the egress guard, the
> agent rules, the data model — is unchanged.

---

## 1. Why this changed

The original plan (Render + Atlas M0 + Groq free tier) was chosen under a hard **₹0/month** ceiling
(see [00_SEM6_AUDIT.md](00_SEM6_AUDIT.md) §4). AWS credits are now available, which removes that
constraint and buys three things the free-tier plan could not:

1. **A real multi-provider evaluation.** Groq, Gemini *and* Bedrock behind one interface turns
   Chapter 4 from "we used the free one" into a measured comparison across providers.
2. **A defensible deployment story.** A security project that deploys with long-lived access keys
   pasted into a dashboard undercuts its own thesis. OIDC federation, Secrets Manager and
   least-privilege IAM are the credible version.
3. **Managed artifact storage.** OpenAPI specs and evaluation outputs belong in object storage, not
   as documents inside Mongo.

**The ₹0/month claim is now void and the report must say so.** Replacing an honest "costs nothing"
with a quiet "costs something" would be exactly the kind of unstated claim this project exists to
avoid. State the actual spend in Chapter 5.

---

## 2. Service map

| Concern | Service | Why this one |
|---|---|---|
| **LLM inference** | **Bedrock** | Third provider behind the Phase 7 abstraction. Groq stays primary (fastest, still free); Bedrock is selectable per run and used for the ablation. |
| **API server** | **App Runner** | Runs the long-lived Express container from a Dockerfile. **Not Lambda** — see §3. |
| **Frontend** | **S3 + CloudFront** | Static `web/` build. Effectively free at this volume, and gives a real CDN + TLS story. |
| **Spec & artifact storage** | **S3** | Imported OpenAPI documents (F4) and evaluation outputs (F10). Presigned URLs, versioning on. |
| **Database** | **MongoDB Atlas M0** — *unchanged, free* | DocumentDB was **rejected**: no free tier, ~$200/month minimum, VPC required. Atlas M0 alongside AWS compute is completely normal and the data model does not change. |
| **Secrets** | **Secrets Manager** (prod) / `.env` (local) | `config/env.js` gains a loader that resolves from Secrets Manager when `AWS_SECRETS_ID` is set, falling back to `.env`. No other code changes. |
| **CI → deploy** | **GitHub Actions + OIDC** | Short-lived credentials assumed via an IAM role. **No AWS keys stored in GitHub.** |
| **Container images** | **ECR** | App Runner pulls from here. |

### Deliberately NOT used

| | Why not |
|---|---|
| **DocumentDB** | ~$200/month minimum, no free tier, VPC required. Atlas M0 is free and sufficient. |
| **Lambda for the API** | See §3. |
| **Cognito** | JWT + Google OAuth already work and are the strongest part of the Sem 6 codebase. Replacing working auth is churn, not progress. |
| **OpenSearch / Kendra** | [01_PRD.md](01_PRD.md) §4 explicitly cuts vector RAG. Spec retrieval is the honest form of that claim. |

---

## 3. Why App Runner and not Lambda

This is worth being able to defend in the viva, because "why not serverless?" is an obvious question.

- **The security agent runs six probe families**, each with a 10s egress timeout
  ([02_TRD.md](02_TRD.md) §7). A worst-case scan approaches Lambda's practical execution window; a
  timeout mid-scan produces partial findings with no clean way to report them.
- **The per-host rate limiter (≤ 5 req/s) needs shared state.** In Lambda every concurrent
  invocation is a separate process with its own counter, so the limit is silently multiplied by the
  concurrency. Enforcing it properly would mean adding ElastiCache or DynamoDB — new infrastructure
  to re-implement something that is four lines in a single process.
- **Cold starts during a viva.** Already a risk on free tiers; Lambda adds another layer.

App Runner keeps the process model the code already assumes, so **no application code changes** to
support it — only a Dockerfile.

---

## 4. What actually changes, by phase

| Phase | Change |
|---|---|
| 0–3 | **Nothing.** Complete and unaffected. The MCP layer, agents and egress guard are provider-agnostic by design. |
| **4 — Egress guard** | **Becomes more important, not less.** `169.254.169.254` is the EC2/ECS instance metadata endpoint (IMDS). On AWS, an unguarded SSRF is a direct path to the task role's credentials. The blocked-range tests stop being theoretical. |
| 5 — MCP layer | Unchanged. Tools are transport-agnostic. |
| 6 — Fixtures | Unchanged; still local Express apps. |
| **7 — LLM abstraction** | Add a **third adapter**: `bedrock.js` alongside `groq.js` and `gemini.js`, behind the same `generateJSON({ system, prompt, schema })`. One file. |
| 8 — Security agent | Unchanged. |
| **9 — OpenAPI ingestion** | Imported specs stored in **S3**, referenced by key from the `ApiSpec` document. |
| 10–12 — Frontend | Unchanged in code. Deployment target becomes S3 + CloudFront. |
| **13 — Deployment Agent** | **Retargeted from Render to AWS.** `deploy_service` triggers an App Runner deployment instead of a Render one. Risk class stays `deploy.write`. This is the largest single change. |
| **14 — Evaluation** | **Gains a dimension.** Groq vs Gemini vs Bedrock on the same benchmark, with real cost-per-run per provider. Stronger than the original plan. |
| 15 — Hardening | Deploy target changes; the checklist does not. |
| 16 — Report | Must state the real monthly cost and that the ₹0 claim no longer holds. |

---

## 5. Environment additions

Added to `.env.example`. All optional — **absence must not break boot**, same rule as Google OAuth.

```
AWS_REGION=ap-south-1
AWS_S3_BUCKET=                  # specs + evaluation artifacts
AWS_SECRETS_ID=                 # Secrets Manager secret id; falls back to .env when unset
BEDROCK_MODEL_ID=apac.amazon.nova-lite-v1:0
LLM_PRIMARY=groq                # groq | gemini | bedrock
```

### Model choice: Amazon Nova, not Claude

**Decided 17 Aug 2026 after testing every available model against the real account.**

Anthropic models on Bedrock are delivered via an **AWS Marketplace subscription**, which cannot be
created without a valid payment instrument on the account. Every Haiku variant is therefore blocked
(`INVALID_PAYMENT_INSTRUMENT` / `aws-marketplace:Subscribe not authorized`), and the Sonnet models
that do work are ~12× the price.

**Amazon Nova is AWS first-party — no Marketplace subscription, so it is not affected.** Verified
working and producing valid JSON on the first attempt:

| Model | in / out per M tokens | Notes |
|---|---|---|
| `apac.amazon.nova-micro-v1:0` | ~$0.035 / $0.14 | cheapest; clean unfenced JSON |
| **`apac.amazon.nova-lite-v1:0`** | **~$0.06 / $0.24** | **default** — clean unfenced JSON |
| `apac.amazon.nova-pro-v1:0` | ~$0.80 / $3.20 | for quality comparison |

Nova Lite is roughly **4× cheaper than Claude Haiku** and **50× cheaper than Sonnet**, which removes
LLM inference as a budget concern almost entirely.

Also verified working, and useful as evaluation comparators: `qwen.qwen3-32b-v1:0`,
`mistral.ministral-3-8b-instruct`, `google.gemma-3-12b-it`, `openai.gpt-oss-120b-1:0`.

> **This makes Chapter 4 stronger, not weaker.** The ablation becomes Groq (Llama) vs Gemini vs
> Bedrock Nova — three genuinely different model families from three vendors — plus a cheap
> within-Bedrock sweep across Micro / Lite / Pro. That is a far better result than "we used the free
> one", and it is now affordable enough to run repeatedly.

### Use the Converse API, not InvokeModel

`bedrock-runtime converse` normalises the request and response shape across every model family.
`invoke-model` requires a different body per vendor (`anthropic_version` for Claude, a different
schema for Nova, another for Mistral), which would push vendor-specific branching into the adapter.

With Converse, switching model is a **config change, not a code change** — which is the whole point
of the Phase 7 abstraction.

### Bedrock requires an *inference profile*, not a bare model id

Verified 17 Aug 2026 against the real account. Invoking the bare model id fails:

```
ValidationException: Invocation of model ID anthropic.claude-haiku-4-5-20251001-v1:0
with on-demand throughput isn't supported. Retry your request with the ID or ARN of
an inference profile that contains this model.
```

Newer Bedrock models are only reachable through a regional or global **inference profile**, whose id
carries a prefix (`global.`, `apac.`, `us.`). The Bedrock adapter in Phase 7 must therefore treat
`BEDROCK_MODEL_ID` as a profile id, and the setup guide must say so — this error is otherwise a very
confusing first thing to hit.

List what is actually invokable:

```bash
aws bedrock list-inference-profiles --region ap-south-1 \
  --query "inferenceProfileSummaries[?status=='ACTIVE'].inferenceProfileId" --output text
```

> **Region note:** `ap-south-1` (Mumbai) carries a *richer* Claude catalogue than `us-east-1`
> — Haiku 4.5, Sonnet 5 and Opus 5 versus Haiku-only in us-east-1 — and is closest to Jaipur.
> Mumbai for everything is the right call; there is no need to split regions.

**Credentials are never put in `.env` in production.** Locally, the default credential chain picks up
`~/.aws/credentials`. On App Runner, an instance role supplies them. In CI, OIDC does. There is no
path in this design where a long-lived AWS key is written to a file this repository can see.

---

## 6. Manual setup required — Adarsh, not Claude

These need console access and cannot be automated from here:

1. **Enable Bedrock model access** — console → Bedrock → Model access → request the Claude models.
   Access is per-region and is *not* on by default. Confirm the region has the model you want
   (`ap-south-1` has fewer models than `us-east-1`).
2. **Create the S3 bucket** — block all public access, enable versioning.
3. **Create a new MongoDB Atlas M0** — the old cluster (`cluster0.t0xwwwe`) no longer resolves and
   must be replaced regardless of this decision.
4. **Local AWS credentials** — `aws configure` with a least-privilege user, or SSO.
5. **Later, for Phase 13/15** — ECR repository, App Runner service, and a GitHub OIDC identity
   provider plus deploy role.

Claude will not create AWS accounts, IAM users, or handle access keys. Supply the region and bucket
name and the code side follows.

---

## 7. Cost, honestly

**Hard ceiling: $40/month (Adarsh, 17 Aug 2026). Design to land near $15.**

| Service | Expected / month | Notes |
|---|---|---|
| Atlas M0 | **$0** | Free tier. This is why DocumentDB was rejected, not chosen. |
| S3 + CloudFront | **< $1** | Specs and a static build are megabytes, not gigabytes. |
| ECR | **< $1** | One small image, lifecycle policy to keep 3 tags. |
| App Runner (0.25 vCPU / 0.5 GB) | **~$5–9** | ~$2.60 provisioned memory + active compute. The only fixed cost. |
| Bedrock | **~$3–8** | The variable one. Claude Haiku ≈ $0.25 / $1.25 per M tokens. |
| **Total** | **~$10–18** | Comfortably inside $40, with headroom for evaluation sweeps. |

### Staying inside the ceiling

These are engineering controls, not good intentions — and they are worth a paragraph in the report,
because cost-awareness is part of the "unaccountable automation" argument in
[01_PRD.md](01_PRD.md) §2.

1. **AWS Budgets alert at $25 and a hard alert at $35.** Set this up *before* the first Bedrock call.
2. **Haiku, not Sonnet.** Roughly 12× cheaper for a task where the model proposes assertions and never
   judges them. If quality is insufficient, measure it and say so rather than reaching for a bigger
   model by reflex.
3. **Groq stays primary for day-to-day development** — it is free and fast. Bedrock is used
   deliberately: for the evaluation sweep, the ablation, and the demo.
4. **Token caps per run**, enforced in the LLM abstraction (Phase 7), so a runaway prompt cannot
   produce a runaway bill.
5. **The evaluation harness reports actual spend per provider** (F10 already requires cost and
   latency). That turns the budget into a measured number in Chapter 4 rather than a worry.
6. **Pause App Runner between work sessions** if the fixed cost matters. It is the one charge that
   accrues while nothing is happening.

### If even ~$10/month is too much

Fallback, in order of preference — decide at Phase 15, not now:
- **Lightsail container, $7/month flat.** Predictable, no surprises, same Dockerfile.
- **Keep Render's free tier for the API** and use AWS only for Bedrock + S3 + CloudFront. This keeps
  every AWS benefit that matters to the report and drops the fixed cost to near zero.

Nothing in Phases 4–12 depends on which of these is chosen, so the decision can wait.

---

## LLM routing — decided by measurement (Aug 2026)

**Bedrock is primary; Groq is the fallback.** The chain used to resolve to Groq alone, because
`LLM_FALLBACK=bedrock` was set but `BEDROCK_MODEL_ID` was not, and `providerOrder()` silently
drops a provider it cannot use. That looked configured and was not. The boot log now warns when a
named provider is unusable, and says explicitly when the chain has no fallback.

### Why Bedrock over Groq

| | Bedrock (Nova Lite) | Groq (gpt-oss-120b) |
| --- | --: | --: |
| Cost per generation | **$0.000156** | $0.00055 |
| Latency | **~2.4 s** | ~4.0 s |
| Free-tier TPM limit | none hit | **aborted 3 evaluation runs** |
| Mutation score (grounded) | **46.7%** | 26.7% |

Cheaper, faster, better on the benchmark, and AWS-native — which is what this document argued for
in the first place.

### Per-task routing

Generation and explanation are different problems, so they route independently
(`TASK_MODELS` in `server/src/services/llm.js`, every entry env-overridable).

| Task | What it is | Bedrock | Groq |
| --- | --- | --- | --- |
| `generation` | 5 test cases as structured JSON, once per run, sets suite quality | `nova-lite` | `gpt-oss-120b` |
| `explanation` | 2 sentences on one failure, ~200 tokens, once per failure | `nova-lite` | `gpt-oss-20b` |

### The two measurements that overturned the obvious assignment

**Cheapest model for the cheap task was wrong.** On explanation (n=6): `nova-micro` succeeded
3/6 at 1115 ms, `nova-lite` 6/6 at 903 ms. Explanations run with `maxRepairs: 0` by design, so
half of Micro's calls produced nothing while still costing tokens — dearer *and* slower per
successful explanation.

**The most expensive model was also wrong.** Full harness per tier, 3 repeats each:

| Generation model | Mutation score (grounded) | Range | Cost per run |
| --- | --: | --: | --: |
| `nova-lite` | **46.7%** | 40–50% | **$0.0042** |
| `nova-pro` | 33.3% | 30–40% | $0.0559 |

Lite led on every repeat and left fewer behaviours unchecked. Bigger was not better, and it cost
13× more to be worse.

**Consequence, stated plainly:** on Bedrock both tasks currently resolve to the same model,
because that is what the evidence supports. The routing exists so the tiers *can* diverge — the
Groq fallback already does — not to manufacture a split the measurements contradict.

### Monthly cost at this configuration

One run ≈ 1 generation + up to 3 explanations ≈ **$0.0004**. Even a thousand runs a month is well
under a dollar, comfortably inside the $30–40 ceiling.
