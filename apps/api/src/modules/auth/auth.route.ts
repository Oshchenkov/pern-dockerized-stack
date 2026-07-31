import { Router } from "express";
import signUpRouter from "./signup/signup.route";
import signInRouter from "./signin/signin.route";

const router: Router = Router();

router.use("/signup", signUpRouter);
router.use("/signin", signInRouter);

export default router;
