// import express from "express";
// import cors from "cors";
// import { Server } from "socket.io";
// import http from "http";
// import path from "path";
// import connectDB from "./backend/db.js";
// import authRoutes from "./backend/routes/authRoutes.js";
// import sessionRoutes from "./backend/routes/sessionRoutes.js";
// import Session from "./backend/models/Session.js";
// import ACTIONS from "./src/Actions.js";

// const app = express();
// app.use(cors());
// app.use(express.json());

// // Connect DB
// connectDB();

// const express = require("express");

// const http = require("http");
// const path = require("path");
// const { Server } = require("socket.io");
// const ACTIONS = require("./src/Actions");

// const server = http.createServer(app);
// const io = new Server(server);

// app.use("/api/auth", authRoutes);
// app.use("/api/session", sessionRoutes);

// app.use(express.static("build"));
// app.use((req, res, next) => {
//   res.sendFile(path.join(__dirname, "build", "index.html"));
// });

// const userSocketMap = {};
// const roomCodeMap = {}; // New: Stores code for each room

// function getAllConnectedClients(roomId) {
//   return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
//     (socketId) => {
//       return {
//         socketId,
//         username: userSocketMap[socketId],
//       };
//     }
//   );
// }

// io.on("connection", (socket) => {
//   console.log("socket connected", socket.id);

//   // New: Handle code sync request
//   socket.on(ACTIONS.REQUEST_CODE, ({ roomId }) => {
//     const code = roomCodeMap[roomId] || '';
//     socket.emit(ACTIONS.SYNC_CODE, { code });
//   });

//   socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
//     userSocketMap[socket.id] = username;
//     socket.join(roomId);
    
//     // Send existing code to the new user
//     if (roomCodeMap[roomId]) {
//       socket.emit(ACTIONS.SYNC_CODE, { code: roomCodeMap[roomId] });
//     }
    
//     const clients = getAllConnectedClients(roomId);
//     clients.forEach(({ socketId }) => {
//       io.to(socketId).emit(ACTIONS.JOINED, {
//         clients,
//         username,
//         socketId: socket.id,
//       });
//     });
//   });

//   socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code , username}) => {
//     // Store the latest code for the room
//     roomCodeMap[roomId] = code;
//     // Broadcast to all other clients in the room
//     socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code, username });
//   });

//   socket.on(ACTIONS.SEND_MESSAGE, ({ roomId, message }) => {
//     socket.in(roomId).emit(ACTIONS.SEND_MESSAGE, { message });
//   });

//   // Clean up room data when last user leaves
//   socket.on("disconnecting", () => {
//     const rooms = [...socket.rooms];
//     rooms.forEach((roomId) => {
//       socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
//         socketId: socket.id,
//         username: userSocketMap[socket.id],
//       });
      
//       // Remove room code if room becomes empty
//       const clientsInRoom = io.sockets.adapter.rooms.get(roomId);
//       if ((clientsInRoom && clientsInRoom.size === 1) || !clientsInRoom) {
//         delete roomCodeMap[roomId];
//       }
//     });
//     delete userSocketMap[socket.id];
//     socket.leave();
//   });
// });

// const PORT = process.env.PORT || 5001;
// server.listen(PORT, () => console.log(`Listening on port ${PORT}`));



// In server.js

// Load environment variables from the .env file
require('dotenv').config();

// Now you can access the secret key
const SECRET = process.env.JWT_SECRET;

// ... rest of your code


const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");
const http = require("http");
const path = require("path");
const connectDB = require("./backend/db.js");
const authRoutes = require("./backend/routes/authRoutes.js");
const sessionRoutes = require("./backend/routes/sessionRoutes.js");
const Session = require("./backend/models/Session.js");
const ACTIONS = require("./src/Actions.js");

const app = express();
app.use(cors());
app.use(express.json());

// Connect DB
connectDB();

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/session", sessionRoutes);

// Serve React build
app.use(express.static("build"));
app.use((req, res, next) => {
  res.sendFile(path.join(process.cwd(), "build", "index.html"));
});

// Socket.io setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

const userSocketMap = {};
const roomCodeMap = {}; // memory cache for fast sync

// Get all connected clients in a room
function getAllConnectedClients(roomId) {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    (socketId) => ({
      socketId,
      username: userSocketMap[socketId]?.username || userSocketMap[socketId], // fallback for old format
    })
  );
}

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // Request current code for a room
  socket.on(ACTIONS.REQUEST_CODE, async ({ roomId }) => {
    let code = roomCodeMap[roomId];
    if (!code) {
      const session = await Session.findOne({ sessionId: roomId });
      code = session ? session.code : "";
      roomCodeMap[roomId] = code;
    }
    socket.emit(ACTIONS.SYNC_CODE, { code });
  });

  // Join a room
  const Note = require("./backend/models/Note.js"); // Import the new model
  socket.on(ACTIONS.JOIN, async ({ roomId, username, userId }) => {
    userSocketMap[socket.id] = { username };
    socket.join(roomId);
    const newNote = new Note({
        sessionId: roomId,
        userId: userId,
        username: username,
        action: "joined",
        message: `${username} joined the room.`,
        codeContent: code, // Store the edited code here
    });
    await newNote.save();

    // Send existing code
    let code = roomCodeMap[roomId];
    if (!code) {
      const session = await Session.findOne({ sessionId: roomId });
      code = session ? session.code : "";
      roomCodeMap[roomId] = code;
    }
    socket.emit(ACTIONS.SYNC_CODE, { code });

    // Save code to DB on join (optional, ensures DB always has latest)
    //if(userId){
    await Session.findOneAndUpdate(
      { sessionId: roomId },
      { code, lastUpdated: Date.now() },
      { upsert: true }
    );
  //}

    const clients = getAllConnectedClients(roomId);
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit(ACTIONS.JOINED, {
        clients,
        username,
        socketId: socket.id,
      });
    });
  });

  // Code change
  socket.on(ACTIONS.CODE_CHANGE, async ({ roomId, code, username , userId}) => {
    roomCodeMap[roomId] = code; // update memory
    socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code, username });

    // Save/update in DB
    await Session.findOneAndUpdate(
      { sessionId: roomId },
      { code, lastUpdated: Date.now() },
      { upsert: true }
    );

    const newNote = new Note({
        sessionId: roomId,
        userId: userId,
        username: username,
        action: "code_change",
        message: `${username} is editing the code.`,
        codeContent: code // Store the edited code here
    });
    await newNote.save();
  });

  // Send message to room
  socket.on(ACTIONS.SEND_MESSAGE, ({ roomId, message }) => {
    socket.in(roomId).emit(ACTIONS.SEND_MESSAGE, { message });
  });

  // Disconnect cleanup
 socket.on("disconnecting", async () => {
  const rooms = [...socket.rooms];
  const username = userSocketMap[socket.id];
  const userId = userSocketMap[socket.id]?.userId; // Correctly get userId

  // Check if the username exists before proceeding
  if (username) {
    // Add logic to remove the user from the sessions' user list in the database
    // This is important for concurrency.
    rooms.forEach(async (roomId) => {
      await Session.findOneAndUpdate(
        { sessionId: roomId },
        { $pull: { users: userId } }
      );
      
      // Save a "left" action note to the database
      const newNote = new Note({
        sessionId: roomId,
        userId: userId, // Correctly use the userId
        username: username,
        action: "left",
        message: `${username} has disconnected.`,
      });
      await newNote.save();

      // Emit the disconnected action to the room
      socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
        socketId: socket.id,
        username: username,
      });

      // Remove the room from memory cache if it's empty
      const clientsInRoom = io.sockets.adapter.rooms.get(roomId);
      if (!clientsInRoom || clientsInRoom.size === 0) {
        delete roomCodeMap[roomId];
      }
    });
  }

  // Clean up user from the socket map and leave the room
  delete userSocketMap[socket.id];
  socket.leave();
});
});

// Optional: periodic DB save (every 5s)
setInterval(async () => {
  for (const roomId in roomCodeMap) {
    await Session.findOneAndUpdate(
      { sessionId: roomId },
      { code: roomCodeMap[roomId], lastUpdated: Date.now() },
      { upsert: true }
    );
  }
}, 5000);

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));