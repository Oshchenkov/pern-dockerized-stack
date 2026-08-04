import { UnauthorizedError } from "#src/middleware/error.middleware";
import { NextFunction, Request, Response } from "express";

export async function meController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    // req.user is set by authenticate middleware
    const user = await (
      await import("#src/config/prisma")
    ).prisma.user.findUnique({
      where: { id: (req as any).user.sub },
      select: {
        id: true,
        primaryEmail: true,
        primaryEmailVerified: true,
        status: true,
        createdAt: true,
        profile: { select: { name: true, surname: true, avatarUrl: true } },
      },
    });

    if (!user) throw new UnauthorizedError("User not found");

    res.sendResponse(200, { user }, "User profile retrieved successfully");
  } catch (err) {
    next(err);
  }
}
