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

// Middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
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

