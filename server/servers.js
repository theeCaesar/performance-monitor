// Socket.io server that will service both node
// and react clients

// also an entrypoint for our cluster which will make workers

// and the workers will do the Socket.io handling

const cluster = require("cluster"); //so we can use multiple threads
const http = require("http");
const { Server } = require("socket.io");
const numCPUs = require("os").cpus().length;
const { setupMaster, setupWorker } = require("@socket.io/sticky"); // we need the a client can find its way back to the correct worker\

// the primary node can emit to everyone I Think this is better way then redis adapter
const { createAdapter, setupPrimary } = require("@socket.io/cluster-adapter");

const socketMain = require("./socketMain");

if (cluster.isPrimary) {
  console.log(`Master ${process.pid} is running`);

  const httpServer = http.createServer();

  setupMaster(httpServer, {
    loadBalancingMethod: "least-connection",
  });

  setupPrimary();

  cluster.setupPrimary({
    serialization: "advanced",
  });

  httpServer.listen(3000);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  console.log(`Worker ${process.pid} is on`);

  const httpServer = http.createServer();
  const io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:3001",
      credentials: true,
    },
  });

  io.adapter(createAdapter());

  setupWorker(io);

  //socketMain is where I emits and listens
  socketMain(io, process.pid);
}
