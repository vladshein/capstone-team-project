import createHttpError from "http-errors";
import swaggerUI from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";
import fs from "node:fs";
import path from "node:path";

const rootPath = process.cwd(); 
const BASE_SWAGGER_PATH = path.join(rootPath, "swagger", "_base.json");

export const swaggerDocs = () => {
  try {
    const baseSwaggerSpec = JSON.parse(fs.readFileSync(BASE_SWAGGER_PATH).toString());
    const options = {
      swaggerDefinition: baseSwaggerSpec,
      apis: [
        "./swagger/**/*.js",
        "./routes/**/*.js"
      ],
    };

    const swaggerSpec = swaggerJsDoc(options);
    return [...swaggerUI.serve, swaggerUI.setup(swaggerSpec)];
  } catch (err) {
    console.error("❌ SWAGGER INITIALIZATION ERROR:", err);
    return (req, res, next) =>
      next(createHttpError(500, "Can't load swagger docs dynamically"));
  }
};
