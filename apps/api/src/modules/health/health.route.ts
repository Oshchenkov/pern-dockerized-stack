import { Router, Request, Response } from "express";

const router: Router = Router();

router.get("/", (req, res) => {
  res.sendResponse(200, { status: "ok" }, "Api works");
});

export default router;
