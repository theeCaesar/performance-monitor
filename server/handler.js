module.exports = function handleConnection(io, authKey) {
  io.on("connection", (socket) => {
    const { role, key } = socket.handshake.auth;

    if (role === "agent" && key === authKey) {
      socket.join("agents");
    } else if (role === "dashboard") {
      socket.join("dashboards");
    } else {
      socket.disconnect(true);
      return;
    }

    let machineId = null;

    socket.on("metrics", (payload) => {
      if (!machineId && payload.machineId) {
        machineId = payload.machineId;
        io.to("dashboards").emit("agent:status", {
          machineId,
          online: true,
        });
      }
      io.to("dashboards").emit("metrics:update", payload);
    });

    socket.on("disconnect", () => {
      if (machineId) {
        io.to("dashboards").emit("agent:status", {
          machineId,
          online: false,
        });
      }
    });
  });
};
