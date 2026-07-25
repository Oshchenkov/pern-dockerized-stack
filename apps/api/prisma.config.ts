import "./src/config/env";

import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/models/",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
