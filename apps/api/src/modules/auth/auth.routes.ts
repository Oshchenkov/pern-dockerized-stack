import { Router } from "express";
import { authController } from "./auth.controller";
import { validate } from "../../middleware/validate";
import { authenticate } from "../../middleware/authenticate";
import { authLimiter, apiLimiter } from "../../middleware/rateLimiter";
import { signUpSchema, signInSchema } from "./auth.schema";

const router = Router();

// Public routes with strict rate limiting (OWASP: brute-force protection)
router.post(
  "/signup",
  authLimiter,
  validate(signUpSchema),
  authController.signUp,
);

router.post(
  "/signin",
  authLimiter,
  validate(signInSchema),
  authController.signIn,
);

// Refresh: separate rate limiter, cookie-based
router.post("/refresh", authLimiter, authController.refresh);

// Logout
router.post("/logout", apiLimiter, authController.logout);

// Protected
router.get("/me", apiLimiter, authenticate, authController.me);

export { router as authRoutes };
