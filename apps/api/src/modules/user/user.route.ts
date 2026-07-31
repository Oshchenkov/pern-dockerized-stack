import { Router, Request, Response } from "express";
import { limiter } from "#src/middleware/rateLimiter.middleware";
import { asyncHandler } from "#src/utils/asyncHandler";
import { validate } from "#src/middleware/validate.middleware";
import { createUserBody, type CreateUserBody } from "./user.validation";

// API routes
const router: Router = Router();

router.get(
  "/users",
  validate({ body: createUserBody }),
  limiter({ limit: 100 }), // ← inline
  asyncHandler(async (req, res) => {
    // const users = await User.find();
    res.sendResponse(200, [{ user: "user data" }], "Users retrieved");
  }),
);

router.post(
  "/users",
  limiter({
    windowMs: 1 * 60 * 1000,
    limit: 20,
    message: "Stop creating users!",
  }),
  asyncHandler(async (req, res) => {
    // const user = await User.create(req.body);
    res.sendResponse(201, { user: "user data" }, "User created");
  }),
);

// export const usersRouter: IRouter = Router();
// usersRouter.get   ('/',    users.getUsers);
// usersRouter.post  ('/',    users.createUser);
// usersRouter.get   ('/:id', users.getUserById);
// usersRouter.patch ('/:id', users.updateUser);
// usersRouter.delete('/:id', users.deleteUser);

export default router;
