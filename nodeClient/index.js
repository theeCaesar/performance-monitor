// captures local performance data
// then sends it via socket to the server

//  socket.io-client

const os = require("os");
const io = require("socket.io-client");
const options = {
  auth: {
    token: "pythonIsBetter",
  },
};
const socket = io("http://127.0.0.1:3000", options); // the port :3000 is where the main server is listening
socket.on("connect", () => {
  // to identify this machine to the server, for front-end useage ill use mac address
  const nI = os.networkInterfaces();
  let macA; //mac address
  //loop through all net. int. until we find a non-internal one
  for (let key in nI) {
    const isInternetFacing = !nI[key][0].internal;
    if (isInternetFacing) {
      macA = nI[key][0].mac + Math.floor(Math.random() * 100000);
      break;
    }
  }
  const perfDataInterval = setInterval(async () => {
    const perfData = await performanceLoadData();
    perfData.macA = macA;
    socket.emit("perfData", perfData);
  }, 1000);

  socket.on("disconnect", () => {
    clearInterval(perfDataInterval);
  });
});

//finally making use of the hardware knowledge I got from college
// chick the os doc. for more detals
const cpuAverage = () => {
  const cpus = os.cpus();

  let idleMs = 0;
  let totalMs = 0;
  //loop through each core aka thread
  cpus.forEach((aCore) => {
    for (mode in aCore.times) {
      totalMs += aCore.times[mode];
    }
    idleMs += aCore.times.idle;
  });
  return {
    idle: idleMs / cpus.length,
    total: totalMs / cpus.length,
  };
};

const getCpuLoad = () =>
  new Promise((resolve, reject) => {
    const start = cpuAverage(); //"now" value of load
    setTimeout(() => {
      const end = cpuAverage(); //"end" value of load
      const idleDiff = end.idle - start.idle;
      const totalDiff = end.total - start.total;
      // calculate the % of the used cpu
      const percentOfCpu = 100 - Math.floor((100 * idleDiff) / totalDiff); //%
      resolve(percentOfCpu);
    }, 100);
  });

const performanceLoadData = () =>
  new Promise(async (resolve, reject) => {
    const cpus = os.cpus();

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUseage = Math.floor((usedMem / totalMem) * 100) / 100;

    const osType = os.type() === "Darwin" ? "Mac" : os.type();

    const upTime = os.uptime();

    const cpuType = cpus[0].model;
    const numCores = cpus.length;
    const cpuSpeed = cpus[0].speed;

    const cpuLoad = await getCpuLoad();
    resolve({
      freeMem,
      totalMem,
      usedMem,
      memUseage,
      osType,
      upTime,
      cpuType,
      numCores,
      cpuSpeed,
      cpuLoad,
    });
  });
