import { io } from "socket.io-client";

const SERVER_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:3000";

const socket = io(SERVER_URL, {
  auth: { role: "dashboard" },
  reconnection: true,
  reconnectionDelay: 2000,
});

export default socket;
