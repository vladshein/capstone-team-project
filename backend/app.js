import express from "express";
import morgan from "morgan";
import cors from "cors";
import "dotenv/config";
import path from "node:path";

import authRouter from "./routes/authRouter.js";
import userRouter from "./routes/userRouter.js";
import commonRouter from "./routes/commonRouter.js";
// import recipesRouter from "./routes/recipesRouter.js";
// import followRouter from "./routes/followRouter.js";
import notFoundHandler from "./middlewares/notFoundHandler.js";
import errorHandler from "./middlewares/errorHandler.js";
import connectDatabase from "./db/connectDatabase.js";
import { swaggerDocs } from "./middlewares/swaggerDocs.js"; // swagger
// import { syncDatabase } from './db/models/index.js';

const app = express();

// syncDatabase();

const publicDir = path.join(process.cwd(), "public");
const tempDir = path.join(process.cwd(), "temp");

app.use(morgan("tiny"));
app.use(
  cors({
    origin: "*",
  }),
);
app.use(express.json());
app.use(express.static(publicDir));
app.use("/temp", express.static(tempDir));

app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api", commonRouter);
// app.use('/api/recipes', recipesRouter);
// app.use('/api/following', followRouter);
app.use("/api-docs", swaggerDocs()); // swagger

app.use(notFoundHandler);

app.use(errorHandler);

await connectDatabase();

const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
  console.log(`Server is running. Use our API on port: ${port}`);
});
