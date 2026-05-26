import cors from "cors";
import "dotenv/config";

const corsOptions = {
  origin: [process.env.FRONTEND_URL || "http://localhost:5173"],
  credentials: true,
};

export const corsConfig = cors(corsOptions);
