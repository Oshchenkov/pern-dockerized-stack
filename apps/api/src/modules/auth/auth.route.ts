import { Router } from "express";
import signupRouter from "./signup/signup.route";

const router: Router = Router();

router.use("/signup", signupRouter);

export default router;
