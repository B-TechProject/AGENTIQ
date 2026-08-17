# PROGRESS

Running record of the Sem 7 build. Append one section per phase. Records what was built, what was
decided, what deviated from the docs and why, and **what is not done**.

Build order and phase definitions: [MASTER_PROMPT.md](MASTER_PROMPT.md).

---

## Phase 0 — Orient · 17 Aug 2026 · ✅ complete

Read-only audit. No files created, moved or deleted.

### Verified state

**Toolchain**

| Tool | Required | Found | Status |
|---|---|---|---|
| Node | 22.x LTS (≥ 22.12.0) | v25.6.1 | ⚠️ mismatch — unresolved, see Open Questions |
| npm | ≥ 10 | 11.9.0 | ✅ |
| git | — | 2.53.0 | ✅ |
| nvm / fnm / volta | — | none | ⚠️ no way to switch Node |
| gh | — | not installed | ⚠️ blocks push auth when we get there |

**Folder inventory** — five copies of the project existed at the working-folder root.

| Folder | Git | HEAD | Size | Unique work | Disposition |
|---|---|---|---|---|---|
| `agentiq/` | no | — | 186M | none | archived |
| `Autonomous-ASD/` | yes | `543f96c` (1 commit) | 664K | none | archived |
| `backend/` | no | — | 25M | none | archived |
| `BTP/` | yes | `9f6a72e` (7 commits) | 265M | == origin/main | **promoted to working copy** |
| `BTP2/` | yes | `9f6a72e` (7 commits) | 277M | uncommitted only | archived |

Each "none unique" verdict was proven, not assumed:

- `agentiq/` is byte-identical to `BTP/frontend/` under `diff -w --strip-trailing-cr`, except the
  `package.json` `name` field and `LandingPage.tsx` — where `agentiq` holds the **older** copy
  (`'AI Failure Analysis'` / `'GPT-4o'`; BTP has `'Test Runner Agent'` / `'Groq'`). It also carried a
  literal `{src` directory from a broken Windows brace-expansion, containing only `.DS_Store` files.
- `Autonomous-ASD/` HEAD `543f96c821388c18494d919cdfbdfe9ca625d675` **is the root commit of AGENTIQ
  `main`**. Its entire tree is preserved in canonical history.
- `backend/` differs from `BTP/backend/` in exactly one line: `"dev": "nodemon src/server.js"` vs
  `"node src/server.js"`.

**Branch inventory** — `github.com/B-TechProject/AGENTIQ`, 7 commits, Mar–Apr 2026.

| Branch | Tip | Finding |
|---|---|---|
| `main` | `9f6a72e` | canonical |
| `copilot/research-project-architecture-analysis` | `9f6a72e` | **same commit object as main** — safe to delete |
| `feature-backend-service` | `b5c0bdd` | ancestor of main (merged via `912eda5`, PR #1) — safe to delete |

**Line endings** — `BTP` vs `origin/main` is 33 files, **1,689 insertions / 1,689 deletions**
(exactly equal — the CRLF signature). Under `--ignore-all-space` the whole diff collapses to **two
lines** in `LandingPage.tsx`. Confirms the audit's diagnosis of "won't run on Mac". No
`.gitattributes` and no `.nvmrc` existed anywhere in the tree.

**`BTP2` divergence** — identical HEAD to `BTP`; 100% uncommitted working tree. Under
`--ignore-all-space` every backend file drops out (also pure CRLF churn). Genuinely different:
`frontend/src/store/themeStore.ts` (new, 676 B) · `index.css` +118/−29 dark+light CSS custom
properties · `Topbar.tsx` sun/moon toggle · 10 pages mechanically re-pointed at theme variables ·
`ai.service.js` + `aiExplain.service.js` rewired onto the `@google/generative-ai` SDK
(`gemini-2.5-flash`, `responseMimeType: "application/json"`) · `.claude/settings.local.json` with
paths under `/Users/adityagupta`, identifying this as Aditya's machine.

> **Correction to `docs/00_SEM6_AUDIT.md`:** it states BTP2 "uses `@google/generative-ai` instead of
> Groq + axios". `@google/generative-ai@^0.24.1` is a declared dependency in **all three**
> `package.json` files including `origin/main`'s. The real divergence is narrower — BTP2 actually
> *imports and uses* the SDK, where main declares the dep but calls Groq via axios and reaches Gemini
> through a raw REST URL. `frontend/package.json` is byte-identical between BTP and BTP2, so the
> theme work introduced no new dependency.

**Secrets** — full-history scan across all branches and all commits.

- 🔴 **Public:** `JWT_SECRET` literal (32 chars) at `backend/src/server.js:116`, introduced in
  `b5c0bdd`, re-added in `477c822`, live at HEAD. The only real secret that ever reached GitHub.
- 🟢 **Clean:** zero matches for `AIza…`, `gsk_…`, `sk-…`, `GOCSPX-…`, or any real `mongodb+srv://`
  credential in any commit on any branch. `.env` was **never committed**
  (`--diff-filter=A` over all history: no hits). The `mongodb://` strings present are library test
  fixtures inside `node_modules`.
- 🟡 **Local disk only, untracked, three identical copies** (`backend/.env`, `BTP/backend/.env`,
  `BTP2/backend/.env`): `MONGO_URI`, `MONGO_PASSWORD`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
  `NEW_GEMINI_API_KEY`, `GEMINI_API_KEY_2`, `JWT_SECRET`, `GROQ_API_KEY`. `.gitignore` covered them,
  which is why they never leaked.

**Audit bug claims** — all seven confirmed by reading source. `BUG-1` `security.service.js:22,25` ·
`BUG-2` `testAuth` · `BUG-3` `server.js:116` · `BUG-4` `server.js:58` top-level `GoogleStrategy` ·
`BUG-5` `testRunner.service.js:5` module-scoped `explanationUsed` · `BUG-6` `ai.service.js:191` ·
`BUG-7` `security.service.js:37,48`. Hygiene claims also confirmed: `api.ts:5` hardcodes
`http://localhost:3001/api` while `VITE_API_URL` is declared and never read · **2,412 of 2,504
tracked files are `node_modules`** (92 real source files) · `Topbar.tsx:38-40` ships all three
decorative badges · Pollinations at `ai.service.js:97`.

**Two findings worse than the audit records:**

1. `ai.service.js:221` — a comment reading `// 🛑 SAFE FALLBACK` above three hardcoded cases named
   `"Fallback Valid Request"`, `"Fallback Invalid Request"`, `"Fallback Edge Case"`. The exact
   pattern the master prompt forbids, labelled in the source.
2. `frontend/src/hooks/useAI.ts:3` posts to `https://api.anthropic.com/v1/messages` **from the
   browser**, with prompts beginning `"Simulate realistic API test results for: …"` and
   `"Simulate a realistic security scan for API: …"`. Dead code, but the single most damaging file in
   the repo if an examiner greps for `simulate`. **Must not survive the Phase 3 restructure.**

---

## Phase 1 — Salvage and organise · 17 Aug 2026 · ✅ complete

### What was done

1. **Created `_archive/`** and moved `agentiq/`, `Autonomous-ASD/`, `backend/`, `BTP2/` into it
   **unmodified**. Nothing deleted. Both archived git repos verified still readable at their original
   HEADs (`543f96c`, `9f6a72e`).
2. **Promoted `BTP/` to the working copy.** Moved `.git`, `.gitignore`, `README.md`, `backend/`,
   `frontend/`, `node_modules/`, `package.json`, `package-lock.json` to the repo root, then removed
   the empty `BTP/` shell.
   - `BTP/docs/` was **empty** and was deliberately not moved — the root `docs/` holds the five real
     specification documents, and letting an empty directory collide with them was the one
     destructive move available here.
3. **Salvage from `_archive/BTP2/`: nothing carried over.** Reasoning below.
4. **Deleted all 11 `.DS_Store` files.** None were tracked. `.gitignore` already covered `.DS_Store`;
   added `**/.DS_Store` for nested cases.
5. **Verified** `docs/` (all five files) and `MASTER_PROMPT.md` survived at the root.

### Verification

- Root HEAD is `9f6a72e8c47a6fa58c88f493309ef29ea7bb2d75` — **exact match** to `origin/main`.
- 7 commits, remote intact, branch `main`. The Sem 6 evidence trail is untouched.
- Exactly one `.git` directory in the tree.
- Zero `.DS_Store` files.
- Working-tree diff unchanged by the move: still the same CRLF churn, still exactly two real lines in
  `LandingPage.tsx` under `--ignore-all-space`.
- 14 tracked files report missing on disk: all Windows `.cmd`/`.ps1` shims under
  `backend/node_modules/.bin/`. They were never on this Mac. **Phase 2 untracks `node_modules`
  entirely, which resolves all 14** — nothing is lost.

### Decisions

**D1 · Discard the BTP2 theme system.** `frontend/src/store/themeStore.ts`, the `index.css` dark/light
custom-property layer, and the `Topbar.tsx` toggle are **not** salvaged.
*Why:* `docs/04_App_UI.md` §1 mandates *"Light only. No dark theme."* and §10 lists dark theme and
neon accents as explicitly forbidden. The code is also **Tailwind v3** syntax
(`@tailwind base/components/utilities`) against a Phase 10 scaffold that is Tailwind v4 CSS-first.
Carry-over value is zero. Preserved unmodified at `_archive/BTP2/frontend/src/store/themeStore.ts`
if this is ever revisited.

**D2 · Discard the BTP2 Gemini SDK rewrite, keep one idea.** `@google/generative-ai` is **not** in the
`docs/02_TRD.md` §2 dependency matrix, and Phase 7 specifies a single provider abstraction
(`generateJSON({ system, prompt, schema })`), not a second provider-shaped service. The BTP2 prompt
also carries the "EXACTLY 4 test cases" contradiction and the hardcoded-fallback pattern.
**One detail carries forward to Phase 7:** `generationConfig: { responseMimeType: "application/json" }`
is the correct Gemini JSON-mode knob and should be used in the Gemini adapter.

**D3 · Discard `_archive/BTP2/.claude/settings.local.json`.** Machine-local tool config from a
teammate's laptop. No project value.

### Deviations from the docs

**V1 · Pulled `_archive/` into `.gitignore` one phase early.** `MASTER_PROMPT.md` schedules the
`.gitignore` rewrite in Phase 2 task 5. Added the `_archive/` rule now because the archive is ~488 MB
and a single careless `git add -A` before Phase 2 would commit all of it. The full rewrite still
happens in Phase 2.

### Not done / carried forward

- **The three `.env` files still contain the leaked `JWT_SECRET`.** Rotation is Phase 2 task 1.
- **`git remote` still points at `https://github.com/B-TechProject/Autonomous-ASD.git`**, the
  pre-rename URL. It works only because GitHub redirects renamed repositories. Should be repointed to
  the canonical `AGENTIQ.git` in Phase 2 — relying on a redirect is fragile.
- Node is still v25.6.1, not the 22.x the dependency matrix was install-tested against.
- Nothing has been pushed. Adarsh instructed local-only work for now.

### Open questions blocking later work

| # | Question | Blocks |
|---|---|---|
| Q2 | Rotate the never-committed Groq / Gemini / Mongo / Google-OAuth credentials too? Which are still live? | Phase 2 `.env.example` → `.env` |
| Q3 | Install Node 22 LTS (`brew install fnm && fnm install 22`), or knowingly run on 25 and record the deviation? | Phase 3 |
| Q4 | Confirm deletion of the two redundant remote branches (both proven safe) | Phase 2 task 7 |
| Q5 | Push authentication — no `gh`, no verified credential helper for `B-TechProject` | first push |

Q1 (JWT rotation) was answered 17 Aug 2026: replace with the value Adarsh supplied, do not push.
Q6 (BTP2 salvage) resolved by D1–D3 above under the master prompt's delegation to assess and record.
