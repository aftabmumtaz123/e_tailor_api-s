import mongoose from "mongoose";

let isConnected;

export async function connectDB() {
  if (isConnected) return;

  try {
    const db = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = db.connections[0].readyState;
    console.log("MongoDB connected:", isConnected);
  } catch (error) {
    console.error("DB connection failed:", error);
  }
}
