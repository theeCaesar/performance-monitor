const cluster = require("cluster");
const http = require("http");
const { Server } = require("socket.io");
const numWorkers = require("os").cpus().length;
const { setupMaster, setupWorker } = require("@socket.io/sticky");
const { createAdapter, setupPrimary } = require("@socket.io/cluster-adapter");
const handleConnection = require("./handler");

const PORT = parseInt(process.env.PORT, 10) || 3000;
const DASHBOARD_ORIGIN = process.env.DASHBOARD_ORIGIN || "http://localhost:3001";
const AUTH_KEY = process.env.MONITOR_KEY || "agent-handshake-key";

if (cluster.isPrimary) {
  const httpServer = http.createServer();

  setupMaster(httpServer, { loadBalancingMethod: "least-connection" });
  setupPrimary();
  cluster.setupPrimary({ serialization: "advanced" });

  httpServer.listen(PORT, () => {
    process.stdout.write(`Primary running on :${PORT} | spawning ${numWorkers} workers\n`);
  });

  for (let i = 0; i < numWorkers; i++) cluster.fork();

  cluster.on("exit", (worker) => {
    process.stdout.write(`Worker ${worker.process.pid} exited, replacing...\n`);
    cluster.fork();
  });
} else {
  const httpServer = http.createServer();
  const io = new Server(httpServer, {
    cors: { origin: DASHBOARD_ORIGIN, credentials: true },
  });

  io.adapter(createAdapter());
  setupWorker(io);
  handleConnection(io, AUTH_KEY);

  process.stdout.write(`Worker ${process.pid} ready\n`);
}
