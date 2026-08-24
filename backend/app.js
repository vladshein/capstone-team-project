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

// import handlers & DB
import notFoundHandler from "./middlewares/notFoundHandler.js";
import errorHandler from "./middlewares/errorHandler.js";
import connectDatabase from "./db/connectDatabase.js";
import sequelize from "./db/sequelize.js";
import { swaggerDocs } from "./middlewares/swaggerDocs.js";

const app = express();

// Fail fast: перевіряємо обов'язкові env-змінні до старту сервера,
// щоб уникнути неявних помилок пізніше (напр. в JWT-функціях).
const requiredEnvVars = [
  "FRONTEND_URL",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "JWT_EMAIL_VERIFICATION_SECRET",
];
for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    throw new Error(`${key} is not set in .env`);
  }
}

// Увімкнути на хостингу за reverse proxy (Nginx, Render, Railway тощо),
// щоб req.ip містив IP відвідувача з X-Forwarded-For.
if (process.env.TRUST_PROXY === "true") app.set("trust proxy", 1);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "public");
const tempDir = path.join(__dirname, "temp");

// Middlewares
app.use(
  morgan("tiny", {
    // Docker звертається до readiness endpoint регулярно — не засмічуємо access-логи.
    skip: (req) => req.path === "/health" || req.path === "/ready",
  }),
);
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(express.static(publicDir));
app.use("/temp", express.static(tempDir));

// Liveness endpoint для Docker, reverse proxy та зовнішнього моніторингу.
// Він підтверджує, що HTTP-застосунок запущений; поточну доступність БД
// перевірятиме окремий readiness endpoint, якщо він знадобиться.
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// Readiness endpoint: крім запущеного HTTP-застосунку підтверджує,
// що PostgreSQL доступний для нових запитів.
app.get("/ready", async (_req, res) => {
  try {
    // Не засмічуємо логи SQL-запитом Docker healthcheck кожні 10 секунд.
    await sequelize.authenticate({ logging: false });
    res.status(200).json({ status: "ready" });
  } catch {
    res.status(503).json({ status: "unavailable" });
  }
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api", commonRouter);
app.use("/api/shifts", shiftRouter);
app.use("/api/companies", companyRouter);
app.use("/api/worker-profiles", workerProfileRouter);
app.use("/api/location", locationRouter);
app.use("/api-docs", swaggerDocs());
app.use("/api/reviews", reviewRouter);
// app.use('/api/recipes'cipesRouter);
// app.use('/api/following', followRouter);

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
  startServer();
}

export default app;
