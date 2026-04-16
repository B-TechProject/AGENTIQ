# AgentIQ — Agentic API Testing Platform

A production-ready SaaS frontend for an AI-driven API testing platform.
Built with React 18, TypeScript, Vite 5, Tailwind CSS, TanStack Query, Zustand, and Recharts.

---

## Quick Start

```bash
# 1. Install
npm install

# 2. Copy env
cp .env.example .env

# 3. Dev server → http://localhost:5173
npm run dev

# 4. Production build
npm run build
```

> **Auth in dev mode:** Any valid email + 6-char password signs you in locally.
> The app auto-falls back to the Anthropic AI API when the backend is offline.

---

## Project Structure

```
agentiq/
├── index.html
├── vite.config.ts          # Vite + proxy to backend
├── tailwind.config.js      # Full custom dark theme
├── tsconfig.json
├── .env.example
├── .gitignore
└── src/
    ├── main.tsx             # Entry — QueryClient + BrowserRouter
    ├── App.tsx              # Root: Routes + Toaster
    ├── vite-env.d.ts        # ImportMeta types
    ├── index.css            # Tailwind + component CSS classes
    │
    ├── types/
    │   └── index.ts         # All shared TS types
    │
    ├── constants/
    │   └── index.ts         # Colors, mock data, method maps, nav config
    │
    ├── utils/
    │   └── index.ts         # cn(), formatDate(), initials(), relativeTime()…
    │
    ├── store/
    │   ├── authStore.ts     # Zustand auth (persisted to localStorage)
    │   ├── toastStore.ts    # Global toast notification queue
    │   └── index.ts         # Barrel export
    │
    ├── services/
    │   └── api.ts           # Axios instance + all backend API functions
    │
    ├── hooks/
    │   ├── useAuth.ts       # Auth: login, signup, logout, Google OAuth
    │   ├── useAI.ts         # Direct Anthropic AI fallback calls
    │   ├── useTests.ts      # TanStack Query mutations & queries
    │   ├── useLocalStorage.ts
    │   ├── useDebounce.ts
    │   └── index.ts         # Barrel export
    │
    ├── routes/
    │   └── AppRoutes.tsx    # PrivateRoute + GuestRoute guards, all routes
    │
    ├── components/
    │   ├── layout/
    │   │   ├── AppLayout.tsx   # Shell: Sidebar + Topbar + <Outlet>
    │   │   ├── Sidebar.tsx     # Nav, user footer, logout
    │   │   └── Topbar.tsx      # Breadcrumb + status badges
    │   └── ui/
    │       ├── Badge.tsx       # Pill badges (teal/green/red/orange/purple/blue/gray)
    │       ├── Card.tsx        # Glass card with optional glow + hover
    │       ├── CodeBlock.tsx   # Syntax-highlighted block with copy button
    │       ├── Input.tsx       # Input, Select, Textarea (react-hook-form ready)
    │       ├── Loader.tsx      # Full + inline spinner
    │       ├── Modal.tsx       # Accessible modal (Escape key, backdrop click)
    │       ├── Toaster.tsx     # Toast notification renderer
    │       └── index.ts        # Barrel export
    │
    └── pages/
        ├── LandingPage.tsx     # Hero, Launch Agents, Feature cards, Pipeline
        ├── DashboardPage.tsx   # Stats, Bar chart, Agent status, Tabs
        ├── TestRunnerPage.tsx  # AI test generator + runner + results
        ├── SecurityPage.tsx    # Vulnerability scanner (SQLi, XSS, Auth, IDOR)
        ├── HistoryPage.tsx     # Filterable run history + detail modal
        ├── DeployPage.tsx      # Deployment config + active deployments
        ├── SettingsPage.tsx    # Profile, API config, Notifications, Security
        ├── LoginPage.tsx       # Email + Google OAuth
        ├── SignupPage.tsx      # Registration form
        └── NotFoundPage.tsx    # Styled 404
```

---

## Pages & Routes

| Route        | Page                | Auth |
|--------------|---------------------|------|
| `/`          | Command Center      | ✓    |
| `/dashboard` | Dashboard           | ✓    |
| `/test`      | Test Runner         | ✓    |
| `/security`  | Security Scanner    | ✓    |
| `/history`   | Test History        | ✓    |
| `/deploy`    | Deployment          | ✓    |
| `/settings`  | Settings            | ✓    |
| `/login`     | Sign In             | Guest only |
| `/signup`    | Create Account      | Guest only |
| `*`          | 404 Not Found       | —    |

---

## Backend Integration

### Axios instance (`src/services/api.ts`)

```ts
export const api = axios.create({
  baseURL: '/api',          // proxied via vite.config.ts → localhost:3001
  withCredentials: true,    // sends cookies for session auth
})
```

### Required endpoints

| Method | Path                | Request Body                              | Response                          |
|--------|---------------------|-------------------------------------------|-----------------------------------|
| POST   | `/api/ai/generate`  | `{ url, method, description }`            | `{ success, tests: [...] }`       |
| POST   | `/api/ai/run`       | `{ url, method, description }`            | `{ success, data: RunData }`      |
| POST   | `/api/auth/login`   | `{ email, password }`                     | `{ user, token }`                 |
| POST   | `/api/auth/signup`  | `{ name, email, password }`               | `{ user, token }`                 |
| GET    | `/api/auth/google`  | —                                         | Passport.js redirect              |
| GET    | `/api/history`      | —                                         | `{ history: HistoryRun[] }`       |
| GET    | `/api/history/:id`  | —                                         | `{ data: RunData }`               |
| POST   | `/api/deploy`       | `{ repo, platform, branch }`              | `{ deploymentUrl }`               |

### AI fallback

When the backend is unreachable, `TestRunnerPage` and `SecurityPage` automatically
call the Anthropic API directly through `src/hooks/useAI.ts`. No extra config needed
in the browser — the API key is passed via the `/v1/messages` endpoint without auth
headers (consistent with how Claude.ai artifacts work).

To disable the fallback and require the backend, remove the `try/catch` wrapper in
`TestRunnerPage.tsx` `handleGenerate` and `handleRun`.

---

## State Management

| Store / Hook      | Purpose                                     |
|-------------------|---------------------------------------------|
| `useAuthStore`    | Zustand: user, token, isAuthenticated       |
| `useToastStore`   | Zustand: toast queue (auto-dismiss 3s)      |
| `useAuth()`       | Composed: login, signup, logout + navigate  |
| `useGenerateTests`| TanStack mutation → POST /api/ai/generate   |
| `useRunTests`     | TanStack mutation → POST /api/ai/run        |
| `useHistory`      | TanStack query → GET /api/history           |

---

## Theme Customisation

All colours live in `tailwind.config.js`. Key tokens:

```js
colors: {
  teal:   { DEFAULT: '#00d4aa' },   // primary accent
  orange: { DEFAULT: '#f97316' },   // CTA buttons
  purple: { DEFAULT: '#a855f7' },   // secondary accent
  green:  { DEFAULT: '#22c55e' },   // success / pass
  red:    { DEFAULT: '#ef4444' },   // danger / fail
  bg: {
    primary:   '#050d1a',           // page background
    secondary: '#091221',           // input backgrounds
    tertiary:  '#0d1a2e',           // hover fills
  },
  card:   { DEFAULT: '#0a1628' },   // card background
  border: { DEFAULT: '#1a3050' },   // default border
}
```

---

## Scripts

```bash
npm run dev      # Start Vite dev server (port 5173)
npm run build    # TypeScript compile + Vite production build
npm run preview  # Preview production build locally
npm run lint     # ESLint check
```
