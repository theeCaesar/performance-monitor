import io from "socket.io-client";
const options = {
  auth: { token: "deezNuts" },
};
const socket = io.connect("http://localhost:3000", options); //main server is at 3000
socket.on("connect", (data) => {
  //
});
export default socket;
