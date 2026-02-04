// single socket instance
// read jwt and send it 
// send jwt 
// listen events 
// render them
import { io } from "socket.io-client";
console.log(localStorage.getItem("token"));
let socket = null;
export const connectSocket = (token) => {
    console.log(`yaha aaya ${localStorage.getItem("token")}`);
    if(socket){
        console.log("nahi aara");return socket;
    }
    socket = io("http://localhost:5000", {
        auth: { token: token}
    });
    console.log(`yaha aaya1 ${localStorage.getItem("token")}`);
    socket.on("connect", () => {
      console.log("CONNECTED", socket.id);
    });
    socket.on("disconnect", () => {
        console.log("DISCONNECTED");
    });
    socket.on("answer_submitted", (data) => {
        console.log("answer_submitted:", data);
    });
    socket.on("leaderboard_update", (data) => {
        console.log("leaderboard_update", data);
    });
    socket.on("room-message", (data) => {
        console.log("room-message", data);
    });
    socket.on("quizevent", (data) => {
        console.log("quizevent:", data);
    });
    socket.on("Error", (err) => {
        console.error("ERROR:", err);
    });

    return  socket;
};
export {socket};