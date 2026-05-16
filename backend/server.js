// server.js
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import connectDB from "./config/db.js";
import caretakerRoutes from "./routes/caretakerRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js"; // ✅ Import doctor routes
import alertRoutes from "./routes/alertRoutes.js"; // ✅ Import alert routes
import aiChatbotRoutes from "./routes/ai-chatbotRoutes.js";
import { initSocket } from './chat/socket.js';

dotenv.config();
connectDB();

const app = express();

// ============================================================
// CORS — allowed origins from environment variable
// On Render, set: ALLOWED_ORIGINS=https://your-app.vercel.app
// Multiple origins: ALLOWED_ORIGINS=https://a.vercel.app,https://b.vercel.app
// ============================================================
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : "*";

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json());

// Routes
app.use("/api/patient", patientRoutes);
app.use("/api/caretaker", caretakerRoutes);
app.use("/api/doctor", doctorRoutes); // ✅ Add doctor routes
app.use("/api/alerts", alertRoutes); // ✅ Add alert routes
app.use("/", aiChatbotRoutes);
// Base route
app.get("/", (req, res) => {
  res.send("DigiNurse API is running...");
});

// Port setup
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// Initialize Socket.IO
const io = initSocket(server);
console.log('🔌 Socket.IO server initialized');

