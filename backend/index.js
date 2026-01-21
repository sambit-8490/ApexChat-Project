const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { connection } = require("./src/config/db");
const { userRouter } = require("./src/routes/users.routes");
const { messagesRouter } = require("./src/routes/messages.routes");
const { Server } = require("socket.io");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());

app.use("/users/api/auth", userRouter);
app.use("/api/messages", messagesRouter);

app.get("/", (req, res) => {
  res
    .status(200)
    .setHeader("Content-Type", "text/html")
    .send("<h1>Welcome to the ApexChatter Server</h1>");
});

const PORT = process.env.PORT || 3002;

const server = app.listen(PORT, async () => {
  try {
    await connection;
    console.log("Connected to the database successfully");
    console.log(`Server is running on PORT ${PORT}`);
  } catch (error) {
    console.error(error);
  }
});

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});

global.onlineUsers = new Map();

io.on("connection", (socket) => {
  socket.on("add-user", (userId) => {
    onlineUsers.set(userId, socket.id);
  });

  socket.on("send-msg", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("msg-receive", data.message);
    }
  });

  socket.on("disconnect", () => {
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
  });
});
