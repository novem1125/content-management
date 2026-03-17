import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./src/db/schema.ts",   // where your tables are
  out: "./drizzle/migrations",    // migrations folder
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})