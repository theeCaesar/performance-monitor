const socketMain = (io, pid) => {
  io.on("connection", (socket) => {
    let machineMacA;
    // THIS IS not actuall auth token
    // its so we can know what kind of client we are connecting to
    const auth = socket.handshake.auth;
    //nodeClient
    if (auth.token === "pythonIsBetter") {
      socket.join("nodeClient");
    } else if (auth.token === "deezNuts") {
      // reactClient

      socket.join("reactClient");
    } else {
      socket.disconnect();
      console.log("DISCONNECTED!!!");
    }
    console.log(`connected on worker ${process.pid}`);

    socket.on("perfData", (data) => {
      console.log("Tick...", pid, data.macA);
      if (!machineMacA) {
        machineMacA = data.macA;
        io.to("reactClient").emit("connectedOrNot", {
          machineMacA,
          isAlive: true,
        });
      }
      io.to("reactClient").emit("perfData", data);
    });

    socket.on("disconnect", (reason) => {
      io.to("reactClient").emit("connectedOrNot", {
        machineMacA,
        isAlive: false,
      });
    });
  });
};

module.exports = socketMain;
