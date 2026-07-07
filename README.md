# USize — Frontend (React)

React 18 (Create React App) frontend for **USize**, an AI-powered clothing-size-recommendation SaaS: a marketing site, an authenticated dashboard, and an in-browser TensorFlow.js sizing widget, all in one app.

This is one of three independent, separately-versioned projects in the USize monorepo-by-folder:

- **`react-usize-project/`** (this project) — the frontend
- `Nestjs-for-Usize-Project/` — the NestJS REST API backend
- `usize-widget-sdk/` — the embeddable `USize.init/predict/on` widget script merchants embed on their own storefronts

They only talk to each other over HTTP — there is no shared build tooling. Always run commands from inside this folder; there is no root `package.json`.

---

## Setup

```bash
npm install
npm start
```

Opens the dev server at [http://localhost:3000](http://localhost:3000).

### The #1 local-dev gotcha: the proxy port

This app talks to the backend at `/api/v1/...` using **relative paths** (see `src/context/AuthContext.js`). In development, CRA's `"proxy"` field in `package.json` forwards those requests to a real backend process:

```json
"proxy": "http://localhost:3001"
```

For any `apiFetch`/`fetch('/api/v1/...')` call to resolve, the sibling `Nestjs-for-Usize-Project/` backend must actually be running, and its `PORT` env var must match this value exactly. If requests are failing or hanging, check that the backend is up and its port matches this proxy setting **before** assuming a frontend bug. Note this `proxy` field is a dev-server-only feature — it does nothing in a production build (see [Deployment](#deployment)).

If you need both the frontend and backend running together, prefer the `run-fullstack` skill (in `.claude/skills/`) over starting this dev server alone — it health-checks the backend and verifies the proxy/port alignment before declaring things ready.

---

## Commands

Standard CRA scripts — nothing custom beyond the defaults:

| Command | Purpose |
|---|---|
| `npm start` | Dev server on `http://localhost:3000` |
| `npm run build` | Production build to `build/` |
| `npm test` | CRA's Jest watcher |
| `npm test -- src/path/to/File.test.js` | Run a single test file (add `CI=true` to run once and exit instead of watch mode) |

---

## Routing

Routing uses `HashRouter`, not `BrowserRouter` (see `src/App/App.js`) — deliberately, so the built app can be deployed as a static bundle (e.g. an S3/CloudFront distribution or GitHub Pages) with no server-side route handling required. Don't switch this without a good reason.

Routes declared in `src/App/App.js`:

| Path | Page | Notes |
|---|---|---|
| `/` | `HomePage` | Marketing home |
| `/login` | `LoginPage` | |
| `/register` | `RegisterPage` | |
| `/pricing` | `PricingPage` | |
| `/docs` | `DocsPage` | Public API spec for the embeddable widget SDK |
| `/contact` | `ContactPage` | |
| `/dashboard` | `DashboardPage` | **Protected** — wrapped in `ProtectedRoute`, redirects to `/login` if `useAuth().user` is falsy |
| `/accept-invite` | `AcceptInvitePage` | Enterprise team-invite acceptance flow |
| `*` | `NotFoundPage` | |

`/dashboard` is the only route guarded client-side; everything else (including any data fetches inside a page) is otherwise unguarded.

---

## Auth

`src/context/AuthContext.js` owns all backend auth traffic:

- Real calls to `POST /api/v1/auth/login` and `POST /api/v1/auth/register`.
- Tokens are kept in `sessionStorage`, **not** `localStorage` — deliberate, so tokens don't survive a closed tab.
- Exports `apiFetch()`, the wrapper every component should use for authenticated calls. It injects the `Authorization: Bearer` header, and on a `401` does a one-shot silent refresh via `POST /api/v1/auth/refresh` and retries the original request once. If the refresh itself fails, it clears tokens and hard-navigates to `#/login`.

---

## ML / in-browser TensorFlow.js model

- `src/context/ModelContext.js` manages the TF.js model lifecycle client-side: on mount it tries `tf.loadLayersModel` from a `localStorage` key, and falls back to training a fresh model in-browser if none is found. It exposes `modelStatus` (`checking | initializing | ready | error`) plus `markDirty()`/`markReady()` for other components to signal a retrain is needed.
- `src/ml/modelConfig.js` holds the default training dataset and model shape:
  - **Inputs (4):** back width, height, weight, age (each normalized).
  - **Architecture:** dense(100, ReLU) → dense(1000, ReLU) → dense(100, ReLU) → softmax over 6 classes `[XS, S, M, L, XL, XXL]`.
  - **Dataset:** 90 hand-authored samples (15 per size).
  - **Training:** Adam optimizer (lr 0.001), 201 epochs, categorical cross-entropy.

To modify the training dataset or model shape, use the `ml-training-dataset` skill — it also covers keeping value ranges consistent with the backend's upload validation.

---

## i18n

- Uses `react-i18next`, with all resources statically imported in `src/i18n/index.js` (not lazy-loaded) — every namespace for both languages ships in the main bundle.
- One namespace **per page**, per language, under `src/i18n/locales/{en,es}/*.json`: `common`, `home`, `pricing`, `docs`, `contact`, `auth`, `dashboard`, `notfound`, `form`, `team`.
- **Default/fallback language is Spanish** (`fallbackLng: 'es'`) — don't assume English is the default. Language resolution order: `localStorage['usize-lang']` → browser `navigator.language` → `'es'`.
- Adding a page means adding matching JSON files in **both** `en/` and `es/`, and registering the new namespace in `i18n/index.js`'s `resources` map — nothing picks this up automatically. See the `frontend-add-page` skill for scaffolding a new page the way this repo structures it, and `frontend-i18n-audit` for finding/fixing translation drift between languages.

---

## Backend dependency

This frontend expects the backend (`Nestjs-for-Usize-Project/`) to be running and reachable. In development that means proxying `/api/*` to `http://localhost:3001` as described above — that proxy only exists for local dev. Deploying this app to a real environment requires a real routing solution in front of the backend API; see [Deployment](#deployment) below.

---

## Deployment

See [`deployment-guide.md`](./deployment-guide.md) in this folder for a full walkthrough of deploying this frontend to AWS (S3 + CloudFront), including how the dev-only proxy gets replaced in production.
