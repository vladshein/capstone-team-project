import express from "express";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

// import routes
import authRouter from "./routes/authRouter.js";
import userRouter from "./routes/userRouter.js";
import commonRouter from "./routes/commonRouter.js";
import shiftRouter from "./routes/shiftRouter.js";
import companyRouter from "./routes/companyRouter.js";
import workerProfileRouter from "./routes/workerProfileRouter.js";
import reviewRouter from "./routes/reviewRouter.js";
import locationRouter from "./routes/locationRouter.js";
import paymentRouter from "./routes/paymentRouter.js";
import disputeRouter from "./routes/disputeRouter.js";
import adminDisputeRouter from "./routes/adminDisputeRouter.js";

// import handlers & DB
import notFoundHandler from "./middlewares/notFoundHandler.js";
import errorHandler from "./middlewares/errorHandler.js";
import connectDatabase from "./db/connectDatabase.js";
import sequelize from "./db/sequelize.js";
import { swaggerDocs } from "./middlewares/swaggerDocs.js";

const app = express();

// Fail fast: перевіряємо обов'язкові env-змінні до старту сервера
const requiredEnvVars = [
  "FRONTEND_URL",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "JWT_EMAIL_VERIFICATION_SECRET",
  "JWT_PASSWORD_RESET_SECRET",
];
for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    throw new Error(`${key} is not set in .env`);
  }
}

if (process.env.TRUST_PROXY === "true") app.set("trust proxy", 1);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "public");
const tempDir = path.join(__dirname, "temp");

// --- 1. CORS Configuration (ПОВИНЕН БУТИ НАЙПЕРШИМ) ---
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  process.env.FRONTEND_URL,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

app.use(cors(corsOptions));

// --- 2. Global Middlewares ---
app.use(
  morgan("tiny", {
    skip: (req) => req.path === "/health" || req.path === "/ready",
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(express.static(publicDir));
app.use("/temp", express.static(tempDir));

// --- 3. Healthcheck Endpoints ---
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/ready", async (_req, res) => {
  try {
    await sequelize.authenticate({ logging: false });
    res.status(200).json({ status: "ready" });
  } catch {
    res.status(503).json({ status: "unavailable" });
  }
});

// --- 4. API Routes (ПІСЛЯ CORS та express.json) ---
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api", commonRouter);
app.use("/api/shifts", shiftRouter);
app.use("/api/companies", companyRouter);
app.use("/api/worker-profiles", workerProfileRouter);
app.use("/api/location", locationRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/payments", paymentRouter);
app.use("/api-docs", swaggerDocs());
app.use("/api/reviews", reviewRouter);
app.use("/api/disputes", disputeRouter);
app.use("/api/admin", adminDisputeRouter);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

const port = Number(process.env.PORT) || 5000;

const startServer = async () => {
  try {
    await connectDatabase();
    app.listen(port, () => {
      console.log(`Server is running. Use our API on port: ${port}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
};

// Під час тестів застосунок імпортується як Express-інстанс. Сервер при цьому
// не має відкривати порт або підключатися до реальної БД — це робить можливими
// ізольовані integration-тести через supertest.
if (process.env.NODE_ENV !== "test") {
  startServer();}

export default app;
