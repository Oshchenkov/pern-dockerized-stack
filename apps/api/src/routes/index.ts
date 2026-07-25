import { Router, IRouter } from "express";
import healthRouter from "#src/modules/health/health.route";

const v1Router: IRouter = Router();

v1Router.use("/health", healthRouter);

export { v1Router };
