# PulseBoard — Real-Time System Performance Monitor

A full-stack, production-ready system monitoring platform. Deploy a relay server once, run lightweight agents on any machine (Windows / macOS / Linux), and watch live CPU and RAM metrics stream into a dark-themed dashboard — all over WebSockets with zero polling.

```
┌─────────────┐   Socket.IO   ┌──────────────────┐   Socket.IO   ┌───────────────┐
│   Agent(s)  │ ────────────▶ │   Relay Server   │ ────────────▶ │   Dashboard   │
│ (any OS)    │   metrics     │ (Node + Cluster)  │   broadcast   │  (React SPA)  │
└─────────────┘               └──────────────────┘               └───────────────┘
```

---

## Features

### Dashboard
- **Live arc gauges** — animated SVG rings for CPU % and RAM %, color-coded green → blue → orange → red as load climbs
- **Per-machine cards** — hostname, OS platform, uptime, CPU model, core count, clock speed, total/used/free memory
- **Offline detection** — cards dim and show an `OFFLINE` badge the moment an agent disconnects
- **Buffered rendering** — metrics are batched into a 1.5 s flush cycle so the UI stays smooth under high agent count
- **Responsive grid** — `auto-fill` CSS grid, collapses to a single column on mobile
- **Zero dependencies beyond React** — no Redux, no router, no charting library; all gauges are hand-rolled SVG

### Relay Server
- **Multi-process clustering** — forks one worker per CPU core using Node's built-in `cluster` module
- **Sticky sessions** — `@socket.io/sticky` routes each Socket.IO connection to the same worker for the lifetime of the session
- **Cross-worker broadcast** — `@socket.io/cluster-adapter` lets any worker emit to all dashboard sockets, even those handled by sibling workers
- **Role-based auth** — agents must present a shared secret key on connect; dashboards join a separate room; unauthenticated sockets are immediately disconnected
- **Auto-restart** — the primary process watches for worker exits and forks a replacement immediately

### Agent
- **Minimal footprint** — only two runtime dependencies (`socket.io-client`, `node-machine-id`)
- **Stable machine identity** — uses `node-machine-id` (hardware-based UUID) with a MAC address fallback so the same machine always maps to the same dashboard card
- **CPU measurement** — samples kernel/idle tick counters 200 ms apart for an accurate real-time load percentage (avoids the stale `cpus()[n].times` snapshot problem)
- **Configurable tick rate** — defaults to 1 s, override with `TICK_RATE` env var
- **Graceful shutdown** — handles `SIGINT` / `SIGTERM`, stops the metrics interval, and cleanly disconnects before exiting
- **Cross-platform binaries** — `npm run build` compiles standalone executables for Windows, macOS, and Linux via `@yao-pkg/pkg` — no Node.js required on monitored machines

---

## Architecture

```
performance-monitor/
├── server/          # Socket.IO relay (Node.js, clustered)
│   ├── index.js     # Cluster primary: HTTP server, sticky setup, worker fork
│   └── handler.js   # Worker: Socket.IO rooms, auth, metrics fan-out
│
├── dashboard/       # React SPA (Create React App)
│   └── src/
│       ├── App.jsx                  # Root: buffered state, machine map
│       ├── components/
│       │   ├── Header.jsx           # Brand + live machine count
│       │   ├── MachineCard.jsx      # Per-machine card with online/offline state
│       │   └── ArcGauge.jsx         # Animated SVG arc gauge
│       └── utils/
│           ├── socket.js            # Socket.IO singleton (SERVER_URL from env)
│           └── format.js            # formatUptime, formatBytes, loadColor
│
└── agent/           # Metrics collector (Node.js)
    ├── index.js     # Metric collection loop, socket lifecycle
    └── dist/        # Compiled binaries (gitignored)
```

### Data Flow

1. Agent connects → authenticates with `role: "agent"` + `MONITOR_KEY`
2. Server joins it to the `agents` room
3. Every `TICK_RATE` ms the agent emits a `metrics` event with a full snapshot
4. Server fan-outs `metrics:update` to all sockets in the `dashboards` room
5. Dashboard buffers incoming payloads by `machineId`, flushes to React state every 1.5 s
6. On agent disconnect the server emits `agent:status { online: false }` so the card goes dark instantly

### Metrics Payload Shape

```json
{
  "machineId": "a3f1...",
  "hostname": "dev-box",
  "platform": "Linux",
  "uptime": 432000,
  "cpu": {
    "model": "Intel Core i7-10700K",
    "cores": 8,
    "speed": 3800,
    "load": 23
  },
  "memory": {
    "total": 17179869184,
    "free": 4831838208,
    "used": 12348030976,
    "percent": 71.87
  },
  "timestamp": 1712345678901
}
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Server runtime | Node.js 18+ |
| WebSocket layer | Socket.IO 4 |
| Server clustering | `cluster` (stdlib) + `@socket.io/sticky` + `@socket.io/cluster-adapter` |
| UI framework | React 18 |
| Gauges | Hand-rolled SVG with CSS transitions |
| Fonts | Outfit (display) + JetBrains Mono (mono) |
| Agent bundler | `@yao-pkg/pkg` |

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm 9 or later

### 1 — Clone

```bash
git clone https://github.com/theeCaesar/performance-monitor.git
cd performance-monitor
```

### 2 — Server

```bash
cd server
cp .env.example .env       # edit MONITOR_KEY and DASHBOARD_ORIGIN
npm install
npm start                  # or: npm run dev  (file-watch mode)
```

The primary process logs `Primary running on :3000 | spawning N workers`.

### 3 — Dashboard

```bash
cd dashboard
cp .env.example .env       # set REACT_APP_SERVER_URL
npm install
npm start                  # dev server on http://localhost:3001
```

### 4 — Agent

```bash
cd agent
cp .env.example .env       # set MONITOR_SERVER and MONITOR_KEY
npm install
node index.js
```

The agent logs `Connected to <server-url>` on success.

---

## Environment Variables

### `server/.env`

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Port the HTTP server listens on |
| `DASHBOARD_ORIGIN` | `http://localhost:3001` | Allowed CORS origin for dashboard connections |
| `MONITOR_KEY` | `agent-handshake-key` | Shared secret — agents must present this to authenticate |

### `dashboard/.env`

| Variable | Default | Description |
|---|---|---|
| `REACT_APP_SERVER_URL` | `http://localhost:3000` | Full URL of the relay server |

### `agent/.env`

| Variable | Default | Description |
|---|---|---|
| `MONITOR_SERVER` | *(required)* | Full URL of the relay server |
| `MONITOR_KEY` | `agent-handshake-key` | Must match the server's `MONITOR_KEY` |
| `TICK_RATE` | `1000` | Metric collection interval in milliseconds |

---

## Building Agent Binaries

Produce standalone executables — no Node.js needed on target machines:

```bash
cd agent
npm run build          # all three platforms
npm run build:win      # Windows  → dist/perf-agent.exe
npm run build:mac      # macOS    → dist/perf-agent-macos
npm run build:linux    # Linux    → dist/perf-agent-linux
```

Run on the target machine:

```bash
# Linux / macOS
MONITOR_SERVER=https://your-server.onrender.com MONITOR_KEY=secret ./perf-agent-linux

# Windows (PowerShell)
$env:MONITOR_SERVER="https://your-server.onrender.com"
$env:MONITOR_KEY="secret"
.\perf-agent.exe
```

---

## Deployment (Render)

### Server — Web Service

| Field | Value |
|---|---|
| Root directory | `server` |
| Build command | `npm install` |
| Start command | `node index.js` |
| `MONITOR_KEY` | your secret key |
| `DASHBOARD_ORIGIN` | your dashboard URL |

### Dashboard — Static Site

| Field | Value |
|---|---|
| Root directory | `dashboard` |
| Build command | `npm install && npm run build` |
| Publish directory | `build` |
| `REACT_APP_SERVER_URL` | your server URL |

> **Free-tier note:** Render free Web Services spin down after 15 minutes of inactivity. Agents will lose connection while the server is sleeping. Upgrade to a paid instance for always-on monitoring.

---

## Security Considerations

- Change `MONITOR_KEY` to a long random string before any public deployment — `openssl rand -hex 32` works well
- The server's CORS origin is locked to `DASHBOARD_ORIGIN`; set this to your exact dashboard URL in production
- Agents and dashboards are completely separated into Socket.IO rooms — agents cannot receive data, dashboards cannot impersonate agents
- No data is persisted server-side; the relay is stateless beyond in-flight socket state

---

## License

MIT
