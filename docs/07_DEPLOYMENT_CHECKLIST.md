# Pre-deployment checklist

Verified on 18 Aug 2026 against commit `ca1a8e3` by booting the server with
`NODE_ENV=production` and exercising it, not by reading the code.

---

## Verified working

| Check | Result |
| --- | --- |
| Boots under `NODE_ENV=production` | ✅ connects to Atlas, registers 9 tools, listens |
| `ALLOW_PRIVATE_TARGETS=true` in production | ✅ **refused** — server exits 1 with the reason |
| CORS locked to `CORS_ORIGIN` | ✅ unknown origins get no `Access-Control-Allow-Origin` |
| Security headers | ✅ CSP, HSTS, `X-Content-Type-Options`, `X-Frame-Options`; no `X-Powered-By` |
| Cookie flags | ✅ `HttpOnly; Secure; SameSite=None` |
| Error responses | ✅ code + message only, no stack traces |
| Protected routes anonymous | ✅ 401 on `/runs`, `/mcp/audit`, `/mcp/grants`, `/deployments`, `/specs` |
| SSRF with the hatch off | ✅ IMDS, loopback, RFC1918 and `metadata.google.internal` all refused |
| Public hosts still reachable | ✅ `api.github.com` resolved and pinned |
| Secrets in logs | ✅ none — the boot table masks every one |
| Secrets in git history | ✅ none — checked with `git log -S` per secret |
| Frontend bundle | ✅ `VITE_API_URL` baked in, no localhost fallback, no secrets |
| Graceful shutdown | ✅ exits cleanly on `SIGTERM` (what App Runner sends) |
| `trust proxy` | ✅ set to `1` — rate limits key on the real client IP behind a load balancer |
| Database indexes | ✅ all present, including the TTL that expires verification tokens |
| Runtime deps for the image | ✅ none hide in `devDependencies` |
| CI | ✅ **green** on `ca1a8e3`, including the coverage gate and `npm audit` |
| `npm audit` | ✅ 0 vulnerabilities |
| Fresh clone | ✅ 434 tests, lint, typecheck, build — no `.env`, no code edits |

## Not verified

| Item | Why |
| --- | --- |
| The `Dockerfile` builds | Docker is not running on this machine. The dependency layer is checked by other means, but **build it once locally before pushing to ECR**. |
| Google consent round-trip | Needs your Google password. The redirect, client id and `redirect_uri` are confirmed accepted by Google. |

---

## What must be set on the host

`config/env.js` validates all of it at boot and exits non-zero if a required
value is missing, so a misconfigured deploy fails loudly rather than serving
half a product.

### Required

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `PORT` | `3001` (App Runner routes to it) |
| `MONGO_URI` | Atlas SRV string |
| `JWT_SECRET` | **A NEW ONE.** Do not reuse the development secret. |

### Origins — wrong values here break auth in ways that look like other bugs

| Variable | Value |
| --- | --- |
| `CORS_ORIGIN` | The CloudFront domain. Anything else and the browser blocks every call. |
| `APP_BASE_URL` | The CloudFront domain. The Google callback and verification links use it. |
| `API_BASE_URL` | The App Runner domain. The OAuth `redirect_uri` is built from it. |

### Features

| Variable | Note |
| --- | --- |
| `BEDROCK_MODEL_ID` | `apac.amazon.nova-lite-v1:0`. Without it the chain silently falls back to Groq alone. |
| `AWS_REGION` | `ap-south-1` |
| `GROQ_API_KEY` | Fallback provider. |
| `GOOGLE_CLIENT_ID` / `_SECRET` | Add the production redirect URI in the Console **as well as** the local one. |
| `MAIL_DRIVER` / `GMAIL_USER` / `GMAIL_APP_PASSWORD` | Verification email. |
| `RENDER_API_KEY` | Deployment agent. |
| `ALLOW_PRIVATE_TARGETS` | **Leave unset.** The schema refuses `true` in production. |

App Runner reads secrets from Secrets Manager. `AWS_SECRETS_ID` is wired for that.

---

## Order of operations

1. **Build the frontend with the real API URL.** It is baked in at build time,
   so building before the API domain exists produces a bundle that calls the
   wrong host:
   ```bash
   VITE_API_URL=https://<app-runner-domain>/api npm run build
   ```
2. Upload `web/dist` to S3, invalidate CloudFront.
3. Build and push the image to ECR; create the App Runner service.
4. Set every variable above on the service.
5. **Atlas IP access list** — App Runner has no static egress IP, so `0.0.0.0/0`
   is required. Access is controlled by credentials. Say this deliberately in
   the report; unexplained it reads as carelessness.
6. **Google Console** — add `https://<app-runner-domain>/api/auth/google/callback`
   to Authorised redirect URIs and the CloudFront domain to JavaScript origins.
   Keep the localhost entries so local development still works.
7. Set the repository variable `HEALTH_URL` to `https://<app-runner-domain>/api/health`
   so the keep-warm workflow stops no-opping.

## After deploying, check

```bash
curl -s https://<app-runner-domain>/api/health | python3 -m json.tool
```

Expect `status: ok`, `mongo: connected`, `llmChain.order: ["bedrock","groq"]`,
`mail.configured: true`. The chain is reported because configuration naming a
provider does not mean that provider is answering — a gap that once ran a whole
evaluation phase on the wrong one.

Then: sign in with Google, register an account and confirm the verification
email arrives, and run one test against a public API.

---

## Known cost exposure

| Service | Expected |
| --- | --- |
| App Runner | ~$5–15/month at 1 vCPU / 2 GB, scale-to-one |
| S3 + CloudFront | Pennies at this volume |
| Bedrock Nova Lite | ~$0.0004 per run. A thousand runs is under a dollar. |
| Atlas M0 | Free |

Comfortably inside the $30–40 ceiling. The variable to watch is App Runner,
which bills for provisioned capacity rather than requests.
