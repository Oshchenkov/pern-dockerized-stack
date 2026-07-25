import { Application } from "express";
import morgan from "morgan";

export const httpLogger = (app: Application): void => {
  const env = process.env.NODE_ENV;

  if (env === "development") {
    // colored, concise: GET /users 200 12.3 ms - 1234
    app.use(morgan("dev"));
  }

  if (env === "production") {
    // Apache combined format → pipe to file / stdout for log aggregators
    app.use(
      morgan("combined", {
        skip: (_req, res) => res.statusCode < 400, // only log errors in prod
      }),
    );
  }
};
