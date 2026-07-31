import { Router } from "express";
import signUpRouter from "./signUp/signUp.route";
import signInRouter from "./signIn/signIn.route";
import signOutRouter from "./signOut/signOut.route";
import refreshRouter from "./refresh/refresh.route";

const router: Router = Router();

router.use("/signUp", signUpRouter);
router.use("/signIn", signInRouter);
router.use("/signOut", signOutRouter);
router.use("/refresh", refreshRouter);

export default router;
