import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes";
import eventRoutes from "./routes/event.routes";
import ticketTypeRoutes from "./routes/ticket-type.routes";
import promotionRoutes from "./routes/promotion.routes";
import pointRoutes from "./routes/point.routes";
import couponRoutes from "./routes/coupon.routes";
import profileRoutes from "./routes/profile.routes";
import transactionRoutes from "./routes/transaction.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import { startScheduler } from "./services/scheduler.service";
import "dotenv/config";

const app = express();
const PORT = process.env.PORT || 8000;

app.use(
  cors({
    origin: "http://localhost:3000", // Adjust as needed
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/events", ticketTypeRoutes);
app.use("/api", promotionRoutes);
app.use("/api/users/me/points", pointRoutes);
app.use("/api/users/me/coupons", couponRoutes);
app.use("/api/users/me/profile", profileRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  // Start the transaction scheduler for automatic status updates
  startScheduler();
});
