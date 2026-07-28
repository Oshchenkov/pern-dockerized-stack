import { Router } from "express";
import healthRouter from "#src/modules/health/health.route";
import authRouter from "#src/modules/auth/auth.route";

const v1Router: Router = Router();

v1Router.use("/health", healthRouter);
v1Router.use("/auth", authRouter);

export { v1Router };
