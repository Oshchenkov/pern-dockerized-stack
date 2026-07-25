import { prisma } from "../src/config/prisma";
import { hashPassword } from "../src/utils/handlePassword";

async function main() {
  console.log("Starting seed...");

  //   await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  const password = await hashPassword("password123");

  const alice = await prisma.user.create({
    data: {
      email: "alice@example.com",
      name: "Alice",
      password,
      posts: {
        create: [
          {
            title: "Alice First Post",
            content: "Alice first post content",
            published: true,
          },
          {
            title: "Alice Second Post",
            content: "Alice second post content",
            published: false,
          },
        ],
      },
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: "bob@example.com",
      name: "Bob",
      password,
      posts: {
        create: [
          {
            title: "Bob First Post",
            content: "Bob first post content",
            published: true,
          },
        ],
      },
    },
  });

  console.log("Created users:", alice.email, bob.email);
  console.log("Seed completed successfully.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// ---------------
async function main2() {
  // Create a new user with a post
  const user = await prisma.user.create({
    data: {
      name: "Alice",
      surname: "Smith",
      avatarUrl: "https://example.com/alice.png",
      email: "alice132@prisma.io",
      emailVerified: true,
      isActive: true,
    },
  });
}
main2()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    // process.exit(1);
  });
