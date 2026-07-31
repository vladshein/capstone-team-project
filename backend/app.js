import express from "express";
import morgan from "morgan";
import cors from "cors";
import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

// import routes
import authRouter from "./routes/authRouter.js";
import userRouter from "./routes/userRouter.js";
import commonRouter from "./routes/commonRouter.js";
import shiftRouter from "./routes/shiftRouter.js";

// import handlers & DB
import notFoundHandler from "./middlewares/notFoundHandler.js";
import errorHandler from "./middlewares/errorHandler.js";
import connectDatabase from "./db/connectDatabase.js";
import { swaggerDocs } from "./middlewares/swaggerDocs.js";
import { syncDatabase } from "./db/models/index.js";

const app = express();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "public");
const tempDir = path.join(__dirname, "temp");

// Middlewares
app.use(morgan("tiny"));
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.static(publicDir));
app.use("/temp", express.static(tempDir));

// Routes
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api", commonRouter);
app.use("/api/shifts", shiftRouter);
app.use("/api-docs", swaggerDocs());

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

const port = Number(process.env.PORT) || 5000;

const startServer = async () => {
  try {
    await connectDatabase();
    // uncomment for create db
    // await syncDatabase();
    app.listen(port, () => {
      console.log(`Server is running. Use our API on port: ${port}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
};

startServer();