// src/services/rebac.service.ts
import { PrismaClient } from "@prisma/client";
import { redis } from "../lib/redis";

const prisma = new PrismaClient();

const PERMISSION_RELATIONS: Record<string, string[]> = {
  read: ["owner", "admin", "editor", "viewer"],
  write: ["owner", "admin", "editor"],
  delete: ["owner", "admin"],
  manage: ["owner", "admin"],
};

const CACHE_TTL_SECONDS = 30;

export async function can(
  userId: string,
  permission: string,
  objectType: string,
  objectId: string,
): Promise<boolean> {
  const allowedRelations = PERMISSION_RELATIONS[permission];

  if (!allowedRelations) {
    return false;
  }

  const cacheKey = `rebac:${userId}:${permission}:${objectType}:${objectId}`;

  try {
    const cached = await redis.get(cacheKey);

    if (cached === "1") return true;
    if (cached === "0") return false;
  } catch {
    // Ignore cache errors and continue to DB.
  }

  const objectTuples = await prisma.relationshipTuple.findMany({
    where: {
      objectType,
      objectId,
      relation: {
        in: allowedRelations,
      },
    },
  });

  let allowed = false;

  for (const tuple of objectTuples) {
    // Direct user relationship.
    if (tuple.subjectType === "user" && tuple.subjectId === userId) {
      allowed = true;
      break;
    }

    // Organization/group relationship.
    if (tuple.subjectType === "organization") {
      const membership = await prisma.relationshipTuple.findFirst({
        where: {
          subjectType: "user",
          subjectId: userId,
          objectType: "organization",
          objectId: tuple.subjectId,
          relation: {
            in: ["admin", "member"],
          },
        },
      });

      if (!membership) {
        continue;
      }

      // Organization admins get all permissions granted to the organization.
      if (membership.relation === "admin") {
        allowed = true;
        break;
      }

      // Organization members get read/write if organization has editor/viewer.
      // Customize this policy for your product.
      if (
        membership.relation === "member" &&
        ["viewer", "editor"].includes(tuple.relation)
      ) {
        allowed = true;
        break;
      }
    }
  }

  try {
    await redis.set(cacheKey, allowed ? "1" : "0", "EX", CACHE_TTL_SECONDS);
  } catch {
    // Ignore cache write errors.
  }

  return allowed;
}

/*

// Usage

import { can } from "../services/rebac.service";

app.get(
  "/documents/:id",
  authenticate(),
  async (req, res, next) => {
    try {
      const documentId = req.params.id;
      const userId = req.auth!.sub;

      const allowed = await can(
        userId,
        "read",
        "document",
        documentId
      );

      if (!allowed) {
        return res.status(403).json({ error: "forbidden" });
      }

      // Load document.

      return res.json({ ok: true });
    } catch (error) {
      return next(error);
    }
  }
);

//  Creating ReBAC relationships

await prisma.relationshipTuple.create({
  data: {
    subjectType: "user",
    subjectId: userId,
    relation: "owner",
    objectType: "document",
    objectId: documentId,
  },
});

await prisma.relationshipTuple.create({
  data: {
    subjectType: "user",
    subjectId: userId,
    relation: "admin",
    objectType: "organization",
    objectId: organizationId,
  },
});

await prisma.relationshipTuple.create({
  data: {
    subjectType: "organization",
    subjectId: organizationId,
    relation: "editor",
    objectType: "project",
    objectId: projectId,
  },
});


async function invalidateRebacCacheForObject(
  objectType: string,
  objectId: string
) {
  // If using Redis keys exactly like:
  // rebac:{userId}:{permission}:{objectType}:{objectId}
  //
  // You can scan/delete by pattern:
  // rebac:*:{objectType}:{objectId}
  //
  // For high scale, use a version key instead:
  // rebac:version:{objectType}:{objectId}
}

// rebac:version:{objectType}:{objectId}
// rebac:{userId}:{permission}:{objectType}:{objectId}:v{version}

*/
