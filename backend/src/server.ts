import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { resolve } from "path";

import connectDB from "./config/db";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import itemRoutes from "./routes/item.routes";
import borrowRequestRoutes from "./routes/borrow-request.routes";
import reviewRoutes from "./routes/review.routes";
import adminRoutes from "./routes/admin.routes";
import notificationRoutes from "./routes/notification.routes";
import Notification from "./models/Notification";

dotenv.config({ path: resolve(__dirname, "../.env") });

// fail fast with a clear message when required env vars are missing
if (!process.env.MONGO_URI) {
  console.error("MONGO_URI not set — set it in Render environment variables");
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET not set — set it in Render environment variables");
  process.exit(1);
}

connectDB();

const app = express();

app.use(cors());
app.use(express.json({ limit: "25mb" }));

app.get("/", (req, res) => {
  res.send("API Running");
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/borrow-requests", borrowRequestRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});