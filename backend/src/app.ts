import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    message: "Car Dealership API is running",
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
