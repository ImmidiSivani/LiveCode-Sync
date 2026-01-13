// import { io } from "socket.io-client";

// export const initSocket = async () => {
//   const options = {
//     "force new connection": true,
//     reconnectionAttempt: "Infinity",
//     timeout: 10000,
//     transports: ["websocket"],
//   };
//   return io(process.env.REACT_APP_BACKEND_URL, options);
// };
import { io } from "socket.io-client";

export const initSocket = async () => {
  const options = {
    forceNew: true, // Ensures a new connection is established every time
    reconnectionAttempts: Infinity, // Retry forever if connection is lost
    reconnectionDelay: 1000, // Wait 1 second before retrying
    timeout: 20000, // Wait 20 seconds before timing out
    transports: ["websocket"], // Use WebSocket transport
  };

  const socket = io(process.env.REACT_APP_BACKEND_URL || "http://localhost:5001", options);

  socket.on("connect", () => {
    console.log("Connected to socket server:", socket.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("Disconnected from server:", reason);
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
  });
  

  return socket;
};