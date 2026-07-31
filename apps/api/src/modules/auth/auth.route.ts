import { Router } from "express";
import signUpRouter from "./signUp/signUp.route";
import signInRouter from "./signIn/signIn.route";

const router: Router = Router();

router.use("/signUp", signUpRouter);
router.use("/signIn", signInRouter);

export default router;
