const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// DB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (JS/CSS)
app.use(express.static(path.join(__dirname, "public")));

// Serve views as pages
app.get("/", (req, res) => res.redirect("/login"));
app.get("/login", (req, res) => res.sendFile(path.join(__dirname, "views", "login.html")));
app.get("/signup", (req, res) => res.sendFile(path.join(__dirname, "views", "signup.html")));
app.get("/chat", (req, res) => res.sendFile(path.join(__dirname, "views", "chat.html")));

// API Routes
app.use("/auth", authRoutes);
app.use("/chat", chatRoutes(io));

// Socket.io
io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  socket.on("joinRoom", (room) => {
    socket.join(room);
    socket.data.room = room;
    console.log(`➡️ ${socket.id} joined room: ${room}`);
  });

  socket.on("leaveRoom", (room) => {
    socket.leave(room);
    if (socket.data.room === room) socket.data.room = null;
    console.log(`⬅️ ${socket.id} left room: ${room}`);
  });

  // typing indicator (room-based)
  socket.on("typing", ({ room, username }) => {
    socket.to(room).emit("typing", { username });
  });

  socket.on("stopTyping", ({ room }) => {
    socket.to(room).emit("stopTyping");
  });

  socket.on("disconnect", () => {
    console.log("❌ Disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
