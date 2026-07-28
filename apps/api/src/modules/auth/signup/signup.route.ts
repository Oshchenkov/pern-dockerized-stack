import { Router } from "express";
import { limiter } from "#src/middleware/rateLimiter.middleware";
import { asyncHandler } from "#src/utils/asyncHandler";
import { validate } from "#src/middleware/validate.middleware";
import { signUpSchema } from "./signup.validation";

const router: Router = Router();

router.post(
  "/",
  validate({ body: signUpSchema }),
  limiter({ max: 100 }), // ← inline
  asyncHandler(async (req, res) => {
    // const users = await User.find();
    res.sendResponse(200, [{ user: "user data" }], "Users retrieved");
  }),
);

export default router;
