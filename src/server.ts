import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes";
import eventRoutes from "./routes/event.routes";
import ticketTypeRoutes from "./routes/ticket-type.routes";
import promotionRoutes from "./routes/promotion.routes";
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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
