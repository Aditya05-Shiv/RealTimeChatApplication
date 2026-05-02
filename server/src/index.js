require("dotenv").config();

const cookieParser = require("cookie-parser");
const cors = require("cors");
const express = require("express");
const http = require("http");
const morgan = require("morgan");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");
const setupSocket = require("./socket");
const userRoutes = require("./routes/userRoutes");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5001;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const allowedOrigins = new Set([CLIENT_URL]);
const devOriginPattern = /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}):51\d{2}$/;

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin) || devOriginPattern.test(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
};

const io = new Server(server, {
  cors: corsOptions,
});

app.set("io", io);

app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "chat-api" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api", chatRoutes);

app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  const status = error.statusCode || 500;
  res.status(status).json({ message: error.message || "Internal server error" });
});

const start = async () => {
  await connectDB();
  setupSocket(io);

  server.listen(PORT, () => {
    console.log(`API and Socket.io running on http://localhost:${PORT}`);
  });
};

start().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
