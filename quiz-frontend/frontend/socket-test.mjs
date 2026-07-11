import { io } from "socket.io-client";

const token = "TI8DCChzZKXl17-JzA-NrmznKrhdWfVfoTJVY2B1rmA";

const socket = io("http://ec2-54-226-60-69.compute-1.amazonaws.com:5000", {
  auth: { token }
});

socket.on("connect", () => {
  console.log("connected:", socket.id);

  socket.emit("SUBMIT_ANSWER", {
    roomId: 4,
    questionId: 1,
    selectedOption: 3,
    quizId: 1
  });
});

socket.on("ANSWER_QUEUED", (data) => {
  console.log("ANSWER_QUEUED:", data);
});

socket.on("SOCKET_ERROR", (err) => {
  console.log("SOCKET_ERROR:", err);
});

socket.on("LEADERBOARD", (data) => {
  console.log("LEADERBOARD:", data);
});

setTimeout(() => {
  socket.emit("GET_LEADERBOARD", { roomId: 4 });
}, 2000);

setTimeout(() => {
  socket.disconnect();
  process.exit(0);
}, 5000);