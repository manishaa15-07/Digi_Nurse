// config/db.js
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    console.error("\n💡 Troubleshooting tips:");
    console.error("   1. Check if your MongoDB Atlas cluster exists and is running");
    console.error("   2. Verify your MONGO_URI in .env file is correct");
    console.error("   3. Check your internet connection");
    console.error("   4. Ensure your IP is whitelisted in MongoDB Atlas Network Access");
    console.error("   5. Try using a local MongoDB: mongodb://127.0.0.1:27017/diginurse\n");
    process.exit(1);
  }
};

export default connectDB;
