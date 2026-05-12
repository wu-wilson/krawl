## ⚡ Overview

**Krawl** crawls any website and visualizes its structure as a live force-directed graph. Each page becomes a node, color-coded by HTTP status, so broken links, redirects, and errors surface immediately.

## 🔭 Architecture

```
┌───────────────────────────────────────────────┐
│                    Browser                    │
│                                               │
│  ┌───────────┐  ┌─────────┐  ┌─────────────┐  │
│  │ React UI  │←→│ Zustand │←→│Crawl Engine │  │
│  │(Tailwind) │  │  Store  │  │ (Queue +    │  │
│  └─────┬─────┘  └─────────┘  │  Parser)    │  │
│        │                     └──────┬──────┘  │
│  ┌─────┴─────┐                      │         │
│  │  D3.js +  │                      │         │
│  │  Canvas   │                      │         │
│  └───────────┘                      │         │
└─────────────────────────────────────┼─────────┘
                                      │ fetch
                             ┌────────┴────────┐
                             │  Express Proxy  │
                             │  /fetch  /head  │
                             └────────┬────────┘
                                      │
                                 Target Site
```

## 🚀 Stack

#### Client

- React 18 (TS)
- Tailwind CSS v3
- D3.js + HTML5 Canvas
- Zustand

#### Server

- Express (TS)

## 🛠️ Local Setup

#### 1. Clone the repository

```bash
git clone https://github.com/wu-wilson/krawl.git
cd krawl
```

#### 2. Launch the app

```bash
./launch.sh
```

The script installs dependencies on first run, then starts the proxy server on port `3001` and the client on `http://localhost:5173`.

> Requires Node.js 18+ and npm 9+.

## ☁️ Deployment

Deployed on [Railway](https://railway.app). The client ships as a static build. The proxy server runs as a separate service.

## ⚙️ Configuration

All variables ship with working defaults — `./launch.sh` runs on a fresh clone with no env files. Override only to change a default.

- **Local dev** — create `client/.env` or `server/.env` (both gitignored).
- **Production (Railway)** — variables are set in each service's **Variables** tab.

#### Client (`client/`)

| Variable         | Default                 | Description                                                                                                                                            |
| ---------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `VITE_PROXY_URL` | `http://localhost:3001` | URL of the proxy server. Baked in at **build time** by Vite — changing it requires a rebuild. In production, must point at the deployed proxy service. |

#### Server (`server/`)

| Variable                | Default   | Description                                                                                                                       |
| ----------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `PORT`                  | `3001`    | Port the proxy listens on. Railway auto-injects this, so it's rarely set manually in production.                                  |
| `REQUEST_TIMEOUT_MS`    | `10000`   | Per-request timeout for outbound fetches, in milliseconds. The client mirrors this in `crawler.ts` — the two should stay in sync. |
| `MAX_BODY_SIZE_BYTES`   | `5242880` | Max response body size accepted from a target site, in bytes (5 MB). Larger responses are truncated.                              |
| `RATE_LIMIT_PER_MINUTE` | `1000`    | Max requests per IP per minute. Excess requests receive a `429`.                                                                  |
| `ALLOWED_ORIGINS`       | `*`       | Comma-separated list of allowed CORS origins. In production, should be tightened from `*` to the deployed client's origin.        |
