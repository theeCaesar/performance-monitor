const os = require("os");
const io = require("socket.io-client");
const { machineIdSync } = require("node-machine-id");

const SERVER_URL =
  process.env.MONITOR_SERVER || "https://9wnk9wc1-3000.euw.devtunnels.ms/";
const AUTH_KEY = process.env.MONITOR_KEY || "agent-handshake-key";
const TICK_RATE = parseInt(process.env.TICK_RATE, 10) || 1000;

let tickHandle = null;

const socket = io(SERVER_URL, {
  auth: { role: "agent", key: AUTH_KEY },
  reconnection: true,
  reconnectionDelay: 2000,
  reconnectionAttempts: Infinity,
});

function getStableMachineId() {
  try {
    return machineIdSync(true);
  } catch {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
      const face = nets[name].find((n) => !n.internal);
      if (face) return face.mac;
    }
    return `fallback-${os.hostname()}`;
  }
}

function snapshotCpuTimes() {
  const cores = os.cpus();
  let idle = 0;
  let total = 0;
  for (const core of cores) {
    for (const kind of Object.keys(core.times)) {
      total += core.times[kind];
    }
    idle += core.times.idle;
  }
  return { idle: idle / cores.length, total: total / cores.length };
}

function measureCpuPercent(windowMs = 200) {
  return new Promise((resolve) => {
    const t0 = snapshotCpuTimes();
    setTimeout(() => {
      const t1 = snapshotCpuTimes();
      const dIdle = t1.idle - t0.idle;
      const dTotal = t1.total - t0.total;
      resolve(dTotal === 0 ? 0 : Math.round(100 - (100 * dIdle) / dTotal));
    }, windowMs);
  });
}

async function collectMetrics() {
  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  return {
    machineId: getStableMachineId(),
    hostname: os.hostname(),
    platform: os.type() === "Darwin" ? "macOS" : os.type(),
    uptime: os.uptime(),
    cpu: {
      model: cpus[0].model,
      cores: cpus.length,
      speed: cpus[0].speed,
      load: await measureCpuPercent(),
    },
    memory: {
      total: totalMem,
      free: freeMem,
      used: usedMem,
      percent: Math.round((usedMem / totalMem) * 10000) / 100,
    },
    timestamp: Date.now(),
  };
}

function startStreaming() {
  if (tickHandle) return;
  tickHandle = setInterval(async () => {
    try {
      const metrics = await collectMetrics();
      socket.emit("metrics", metrics);
    } catch (err) {
      process.stderr.write(`Metric collection failed: ${err.message}\n`);
    }
  }, TICK_RATE);
}

function stopStreaming() {
  if (tickHandle) {
    clearInterval(tickHandle);
    tickHandle = null;
  }
}

socket.on("connect", () => {
  process.stdout.write(`Connected to ${SERVER_URL}\n`);
  startStreaming();
});

socket.on("disconnect", (reason) => {
  process.stdout.write(`Disconnected: ${reason}\n`);
  stopStreaming();
});

socket.on("connect_error", (err) => {
  process.stderr.write(`Connection error: ${err.message}\n`);
});

process.on("SIGINT", () => {
  stopStreaming();
  socket.disconnect();
  process.exit(0);
});

process.on("SIGTERM", () => {
  stopStreaming();
  socket.disconnect();
  process.exit(0);
});
